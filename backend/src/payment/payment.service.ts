import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentRepository } from './payment.repository';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { CheckoutResponseDto } from './dto/checkout-response.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { PaymentStatus, RefundStatus } from './const/payment.const';
import { v4 as uuidv4 } from 'uuid';
import { TossPaymentsClient } from './toss/toss-payments.client';
import { ParticipantService } from '../participant/participant.service';
import { GroupBuyingQueryService } from '../group-buying/query/group-buying-query.service';
import { GroupBuyingStatus } from '../group-buying/const/group-buying.const';
import { ParticipantQueryService } from '../participant/query/participant-query.service';

@Injectable()
export class PaymentService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly tossPaymentsClient: TossPaymentsClient,
    private readonly participantService: ParticipantService,
    private readonly groupBuyingQueryService: GroupBuyingQueryService,
    private readonly participantQueryService: ParticipantQueryService,
    private readonly configService: ConfigService,
  ) {}

  // 결제 시작: Payment(INITIATED) 생성
  // 반복 결제할 때마다 Payment Document 생성
  async checkout(dto: CreateCheckoutDto, userId: string): Promise<CheckoutResponseDto> {
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

    // 3. 총대인지 체크
    const isLeader = await this.groupBuyingQueryService.isLeader(userId, gbId);
    if (isLeader) {
      throw new BadRequestException('자신이 주최한 공구에는 참여할 수 없습니다.');
    }

    // 4. 이미 참여한 공구인지 중복 체크
    if (await this.participantQueryService.isParticipant(userId, gbId)) {
      throw new BadRequestException('이미 참여한 공구입니다.');
    }

    const amount = gb.estimatedPrice * count; // 결제해야 하는 금액
    const orderId = uuidv4(); // 랜덤 uuid 생성

    // 5. 결제 시도 기록 생성 (상태: INITIATED)
    const payment = await this.paymentRepository.create({
      gbId,
      userId,
      orderId,
      amount, // 사용자가 총 결제해야 하는 금액
      status: PaymentStatus.INITIATED,
      countSnapshot: count, // 구매 수량
      unitPriceSnapshot: gb.estimatedPrice, // 공구에 등록된 구매 단가
    });

    const clientKey = this.configService.get<string>('TOSS_CLIENT_KEY');
    if (!clientKey) {
      throw new InternalServerErrorException('결제 클라이언트 키가 설정되지 않았습니다.');
    }

    return {
      orderId: payment.orderId,
      amount: payment.amount,
      clientKey,
      orderName: gb.title,
      gbId,
      count,
    };
  }

  // checkout 이후 프론트에서 카드 인증이 될 때까지 기다림. 인증이 완료되면 confirm API로 리다이렉트
  // confirm API에서 금액 변조 검증 후, 토스 클라이언트에 최종 결제 요청
  // 최종 결제가 완료되면(실제로 돈이 빠져나갔다는 의미), DB 상태를 PAID로 바꾸고 참여자 생성
  async confirm(dto: VerifyPaymentDto, userId: string) {
    const { paymentKey, orderId, amount } = dto;

    // 1. [멱등성 체크] 이미 처리된 결제인지 확인
    const payment = await this.paymentRepository.findByOrderId(orderId);
    if (!payment) {
      throw new NotFoundException('존재하지 않는 결제 요청입니다.');
    }
    if (payment.status === PaymentStatus.PAID) {
      return '이미 결제가 완료되었습니다.';
    }
    if (payment.status !== PaymentStatus.INITIATED) {
      throw new BadRequestException(`결제를 진행할 수 없는 상태입니다. (현재: ${payment.status})`);
    }

    // 2. [금액 검증] DB에 기록된 최종 결제 금액과 프론트에서 넘어온 금액이 일치하는지 확인
    if (payment.amount !== amount) {
      throw new BadRequestException('결제 금액이 일치하지 않습니다.');
    }

    // 3. [본인 확인] 결제 소유자 검증
    if (String(payment.userId) !== String(userId)) {
      throw new ForbiddenException('본인의 결제 건만 승인할 수 있습니다.');
    }

    // 4. [상태 검증] 취소된 공구 결제가 승인되지 않도록 confirm 시점에 한 번 더 확인
    const gb = await this.groupBuyingQueryService.getGroupBuyingById(String(payment.gbId));
    if (gb.groupBuyingStatus !== GroupBuyingStatus.RECRUITING) {
      throw new BadRequestException('현재 참여 가능한 모집 상태가 아닙니다.');
    }

    // 5. [결제 실행] 이 API 호출이 성공적으로 리턴되어야 비로소 결제가 완료되었다는 의미 (실제로 돈이 빠져나갔다는 의미)
    const tossResponse = await this.tossPaymentsClient.confirm({
      paymentKey,
      orderId,
      amount,
    });

    // 6. [PaymentRepository] 상태 변경 (INITIATED -> PAID)
    await this.paymentRepository.updateStatus(orderId, {
      status: PaymentStatus.PAID,
      paymentKey: tossResponse.paymentKey,
      approvedAt: tossResponse.approvedAt,
    });

    // 7. 참여자 데이터 생성 (실패 시 보상 트랜잭션)
    // 토스 응답은 DB에만 기록하고, 프론트에는 생성된 참여자만 반환
    try {
      return await this.participantService.joinGroupBuyingAfterPayment(
        String(payment.gbId),
        String(payment.userId),
        payment.countSnapshot,
      );
    } catch (error) {
      // 돈은 이미 빠져나갔는데(3번 성공), 우리 DB에 "공구 참여자 등록"을 하려다 보니 그새 자리가 꽉 찼거나 서버 에러가 발생한 상황입니다.
      // 이때 catch 블록으로 떨어지며, 이미 빠져나간 돈을 다시 돌려주기 위해 토스에 취소(cancel) 요청(환불)을 보내는 것입니다.
      await this.tossPaymentsClient.cancel(
        paymentKey,
        '결제 완료 후 내부 시스템 오류로 참여자 등록 실패',
      );
      await this.paymentRepository.updateStatus(orderId, { status: PaymentStatus.FAILED });

      throw new InternalServerErrorException(
        '결제는 완료되었으나 참여자 등록에 실패하여 자동 환불 처리되었습니다.',
        error,
      );
    }
  }

  // 환불: 토스 취소 호출 및 재고 복구
  async refund(paymentKey: string, cancelReason: string, userId: string) {
    // 1) payment 조회
    const payment = await this.paymentRepository.findByPaymentKey(paymentKey);
    if (!payment) {
      throw new NotFoundException('존재하지 않는 결제입니다.');
    }

    // 2) 소유자 검증
    if (String(payment.userId) !== String(userId)) {
      throw new ForbiddenException('본인의 결제 건만 취소할 수 있습니다.');
    }

    // 3) 멱등성 보장 (이미 환불된 경우)
    if (payment.status === PaymentStatus.REFUNDED) {
      return '이미 환불이 완료되었습니다.';
    }

    // 4) PAID 상태일 때만 취소 가능
    if (payment.status !== PaymentStatus.PAID) {
      throw new BadRequestException(`환불을 진행할 수 없는 상태입니다. (현재: ${payment.status})`);
    }

    // 5) 해당 공구에 참여하고 있는지 여부
    const isParticipant = await this.participantQueryService.isParticipant(
      String(payment.userId),
      String(payment.gbId),
    );
    if (!isParticipant) {
      throw new ForbiddenException('해당 공구의 참여자만 취소할 수 있습니다.');
    }

    const gb = await this.groupBuyingQueryService.getGroupBuyingById(payment.gbId);

    // 6) RECRUITING 상태에서만 취소 가능
    if (gb.groupBuyingStatus !== GroupBuyingStatus.RECRUITING) {
      throw new BadRequestException('모집 중 상태에서만 참여 취소가 가능합니다.');
    }

    // 7) 토스 결제 취소 API 호출
    await this.tossPaymentsClient.cancel(paymentKey, cancelReason);

    // 8) Payment Document 상태 변경 (PAID -> REFUNDED)
    await this.paymentRepository.updateStatusByPaymentKey(paymentKey, PaymentStatus.REFUNDED);

    // 9) 참여자 데이터 삭제 (실패 시 보상 트랜잭션)
    // 토스 응답은 DB에만 기록하고, 프론트에는 취소된 참여자만 반환
    try {
      return await this.participantService.withdrawGroupBuyingAfterRefund(
        String(payment.gbId),
        String(payment.userId),
      );
    } catch (error) {
      // confirm과 달리 여기서 토스 cancel을 다시 호출하면 안 됨. (이미 환불되었으므로 다시 결제하지 않음.)
      throw new InternalServerErrorException(
        '환불은 완료되었으나 참여 취소 처리에 실패했습니다. 고객센터에 문의해 주세요.',
        error,
      );
    }
  }

  // 공구 취소 시, 해당 공구의 PAID 결제를 순차 환불 (실패 건은 수집하고 계속 진행)
  async refundForGroupBuyingCancellation(gbId: string, cancelReason: string) {
    const payments = await this.paymentRepository.findPaidRefundTargetsByGbId(gbId);

    let successCount = 0;
    const failures: { orderId: string; reason: string }[] = [];

    for (const payment of payments) {
      const orderId = String(payment.orderId);
      const paymentKey = payment.paymentKey;

      if (!paymentKey) {
        failures.push({ orderId, reason: 'paymentKey가 없어 환불할 수 없습니다.' });
        continue;
      }

      try {
        // 1) 토스 결제 취소 API 호출
        await this.tossPaymentsClient.cancel(paymentKey, cancelReason);

        // 2) Payment Document 상태 변경 (PAID -> REFUNDED)
        await this.paymentRepository.updateStatusByPaymentKey(paymentKey, PaymentStatus.REFUNDED);

        // 3) 참여자 데이터 삭제
        await this.participantService.withdrawGroupBuyingAfterRefund(
          String(payment.gbId),
          String(payment.userId),
        );

        successCount += 1;
      } catch (error) {
        const reason = error instanceof Error ? error.message : '환불 처리에 실패했습니다.';
        failures.push({ orderId, reason });
      }
    }

    const failCount = failures.length;
    let status = RefundStatus.ALL_SUCCESS;
    if (failCount > 0 && successCount === 0) {
      status = RefundStatus.FAILED;
    } else if (failCount > 0) {
      status = RefundStatus.PARTIAL_SUCCESS;
    }

    return status;
  }
}
