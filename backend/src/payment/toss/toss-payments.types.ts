export interface TossConfirmRequest {
  paymentKey: string; // 토스가 발급한 결제 건 식별자
  orderId: string; // 가맹점이 부여한 주문번호 (우리 DB의 결제 ID와 매칭)
  amount: number; // 승인할 금액 (실제 요청 금액과 일치하는지 검증용)
}

export interface TossPaymentResponse {
  paymentKey: string; // 토스에서 발급한 결제 고유 키
  orderId: string; // 서버에서 발급한 주문 번호
  approvedAt: string | null; // 승인 완료 시각
}

export interface TossErrorResponse {
  code: string;
  message: string;
}
