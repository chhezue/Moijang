import { Injectable, BadRequestException } from '@nestjs/common';
import { PaymentRepository } from './payment.repository';
import { ReservationService } from './reservation.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { PaymentStatus } from './const/payment.const';
import { v4 as uuidv4 } from 'uuid';
import { TossPaymentsClient } from './toss/toss-payments.client';

@Injectable()
export class PaymentService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly tossPaymentsClient: TossPaymentsClient,
    private readonly reservationService: ReservationService,
  ) {}

  // // 1. 결제 시작: 선점과 장부 생성을 한 번에 처리
  // async checkout(dto: CreateCheckoutDto, userId: string) {
  //   const { gbId, count } = dto;
  //
  //   // [ReservationService] 정원 선점 (TTL 적용)
  //   const orderId = uuidv4(); // 랜덤 uuid 생성
  //   await this.reservationService.reserve(gbId, userId, count, orderId);
  //
  //   // [PaymentRepository] 결제 시도 기록 생성 (상태: INITIATED)
  //   const amount = this.calculateAmount(gbId, count); // 총 지불 금액 계산
  //   const payment = await this.paymentRepository.create({
  //     orderId,
  //     amount,
  //     userId,
  //     status: PaymentStatus.INITIATED,
  //   });
  //
  //   return {
  //     orderId: payment.orderId,
  //     amount: payment.amount,
  //     // 프론트에서 토스 SDK 호출 시 필요한 기타 정보들
  //   };
  // }
  //
  // // 2. 결제 승인: 외부 검증 + 상태 변경 + 선점 확정
  // async confirm(dto: VerifyPaymentDto) {
  //   const { paymentKey, orderId, amount } = dto;
  //
  //   // // [멱등성 체크] 이미 처리된 결제인지 확인
  //   // const payment = await this.paymentRepository.findByOrderId(orderId);
  //   // if (payment.status === PaymentStatus.PAID) {
  //   //   return payment;
  //   // }
  //   //
  //   // // [금액 검증] DB에 기록된 금액과 프론트에서 넘어온 금액이 일치하는지 확인
  //   // if (payment.amount !== amount) {
  //   //   throw new BadRequestException('결제 금액이 일치하지 않습니다.');
  //   // }
  //
  //   try {
  //     // [TossPaymentsClient] 토스에 최종 승인 요청
  //     const tossResponse = await this.tossPaymentsClient.confirm({
  //       paymentKey,
  //       orderId,
  //       amount,
  //     });
  //
  //     // [PaymentRepository] 상태 변경 (INITIATED -> PAID)
  //     await this.paymentRepository.updateStatus(orderId, {
  //       status: PaymentStatus.PAID,
  //       paymentKey: tossResponse.paymentKey,
  //       approvedAt: tossResponse.approvedAt,
  //     });
  //
  //     // [ReservationService] 선점 완료 처리 (임시 점유를 확정으로 변경)
  //     await this.reservationService.confirm(orderId);
  //
  //     return tossResponse;
  //   } catch (error) {
  //     // 승인 실패 시 결제 상태 업데이트 및 선점 해제 로직 추가 필요
  //     await this.handlePaymentFailure(orderId, error);
  //     throw error;
  //   }
  // }
  //
  // // 3. 환불: 토스 취소 호출 및 재고 복구
  // async refund(dto: RefundPaymentDto) {
  //   const { paymentKey, cancelReason } = dto;
  //
  //   // [TossPaymentsClient] 토스 취소 API 호출
  //   const cancelResponse = await this.tossPaymentsClient.cancel(paymentKey, cancelReason);
  //
  //   // [PaymentRepository] 상태 변경 (PAID -> REFUNDED)
  //   await this.paymentRepository.updateStatusByPaymentKey(paymentKey, {
  //     status: PaymentStatus.REFUNDED,
  //   });
  //
  //   // [ReservationService] 재고 복구 (취소된 만큼 정원 다시 늘리기)
  //   await this.reservationService.releaseByPaymentKey(paymentKey);
  //
  //   return cancelResponse;
  // }
  //
  // private calculateAmount(gbId: string, count: number): number {
  //   // 상품 가격 정보를 가져와서 계산하는 로직
  //   return 10000 * count;
  // }
  //
  // private async handlePaymentFailure(orderId: string, error: any) {
  //   await this.paymentRepository.updateStatus(orderId, { status: PaymentStatus.ABORTED });
  //   await this.reservationService.release(orderId);
  // }
}
