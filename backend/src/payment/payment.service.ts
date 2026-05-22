import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PaymentRepository } from './payment.repository';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { PaymentStatus } from './const/payment.const';
import { v4 as uuidv4 } from 'uuid';
import { TossPaymentsClient } from './toss/toss-payments.client';
import { ParticipantService } from '../participant/participant.service';
import { GroupBuyingQueryService } from '../group-buying/query/group-buying-query.service';
import { GroupBuyingStatus } from '../group-buying/const/group-buying.const';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly tossPaymentsClient: TossPaymentsClient,
    private readonly participantService: ParticipantService,
    private readonly groupBuyingQueryService: GroupBuyingQueryService,
  ) {}

  // 결제 시작: Payment(INITIATED) 생성
  // 반복 결제할 때마다 Payment Document 생성
  async checkout(dto: CreateCheckoutDto, userId: string) {
    const { gbId, count } = dto;

    // 1. 모집 중 상태인지 확인
    const gb = await this.groupBuyingQueryService.getGroupBuyingById(gbId);
    if (gb.groupBuyingStatus !== GroupBuyingStatus.RECRUITING) {
      throw new BadRequestException('현재 참여 가능한 모집 상태가 아닙니다.');
    }

    // 2. 참여 수량이 정원을 초과하지 않는지 확인
    const currentCount = await this.groupBuyingQueryService.getEffectiveCurrentCount(gbId);
    if (currentCount + count > gb.fixedCount) {
      throw new BadRequestException('공구 정원을 초과했습니다. 수량을 다시 설정해주세요.');
    }

    const amount = gb.estimatedPrice * count; // 결제해야 하는 금액
    const orderId = uuidv4(); // 랜덤 uuid 생성

    // 3. 결제 시도 기록 생성 (상태: INITIATED)
    const payment = await this.paymentRepository.create({
      gbId,
      userId,
      orderId,
      amount, // 사용자가 총 결제해야 하는 금액
      status: PaymentStatus.INITIATED,
      countSnapshot: count, // 구매 수량
      unitPriceSnapshot: gb.estimatedPrice, // 공구에 등록된 구매 단가
    });

    return {
      orderId: payment.orderId,
      amount: payment.amount,
      // TODO 프론트에서 토스 SDK 호출 시 필요한 기타 정보 함께 반환
    };
  }

  async confirm(dto: VerifyPaymentDto) {
    const { paymentKey, orderId, amount } = dto;

    // 1. [멱등성 체크] 이미 처리된 결제인지 확인
    const payment = await this.paymentRepository.findByOrderId(orderId);
    if (!payment) {
      throw new NotFoundException('존재하지 않는 결제 요청입니다.');
    }

    if (payment.status === PaymentStatus.PAID) {
      return { success: true, message: '이미 처리 완료된 결제입니다.' };
    }

    // 2. [금액 검증] DB에 기록된 금액과 프론트에서 넘어온 금액이 일치하는지 확인
    if (payment.amount !== amount) {
      throw new BadRequestException('결제 금액이 일치하지 않습니다.');
    }

    // 3. [TossPaymentsClient] 토스에 최종 승인 요청
    const tossResponse = await this.tossPaymentsClient.confirm({
      paymentKey,
      orderId,
      amount,
    });

    // 4. [PaymentRepository] 상태 변경 (INITIATED -> PAID)
    await this.paymentRepository.updateStatus(orderId, {
      status: PaymentStatus.PAID,
      paymentKey: tossResponse.paymentKey,
      approvedAt: tossResponse.approvedAt,
    });

    // 5. 참여자 데이터 생성 (실패 시 보상 트랜잭션)
    try {
      await this.participantService.joinGroupBuyingAfterPayment(
        payment.gbId,
        payment.userId,
        payment.countSnapshot,
      );
    } catch (participantError) {
      this.logger.error(
        `토스 승인 성공 후 참여자 생성 실패 - orderId: ${orderId}`,
        participantError instanceof Error ? participantError.stack : participantError,
      );

      await this.tossPaymentsClient.cancel(paymentKey, '결제 완료 후 내부 시스템 참여자 등록 실패');

      await this.paymentRepository.updateStatus(orderId, { status: PaymentStatus.FAILED });

      throw new InternalServerErrorException(
        '결제는 완료되었으나 참여자 등록에 실패하여 자동 환불 처리되었습니다.',
      );
    }

    return tossResponse;
  }

  // 3. 환불: 토스 취소 호출 및 재고 복구
  async refund(dto: RefundPaymentDto) {
    const { paymentKey, cancelReason } = dto;

    // [TossPaymentsClient] 토스 취소 API 호출
    const cancelResponse = await this.tossPaymentsClient.cancel(paymentKey, cancelReason);

    // [PaymentRepository] 상태 변경 (PAID -> REFUNDED)
    await this.paymentRepository.updateStatusByPaymentKey(paymentKey, {
      status: PaymentStatus.REFUNDED,
    });

    return cancelResponse;
  }
}
