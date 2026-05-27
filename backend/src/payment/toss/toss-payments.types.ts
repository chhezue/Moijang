/**
  토스 API 문서에서 제공하는 필드 중 결제 승인, 상태 검증, DB 업데이트 및 기본적인 CS 처리에 필요한 핵심 필드
 */

export interface TossConfirmRequest {
  paymentKey: string; // 토스가 발급한 결제 건 식별자
  orderId: string; // 가맹점이 부여한 주문번호 (우리 DB의 결제 ID와 매칭)
  amount: number; // 승인할 금액 (실제 요청 금액과 일치하는지 검증용)
}

export type TossPaymentStatus =
  | 'READY' // 결제 생성 직후
  | 'IN_PROGRESS' // 인증 완료, 승인 전
  | 'WAITING_FOR_DEPOSIT' // 가상 계좌 입금 대기
  | 'DONE' // 승인 완료
  | 'CANCELED' // 취소됨
  | 'ABORTED' // 승인 실패
  | 'EXPIRED'; // 만료됨

export interface TossPaymentResponse {
  paymentKey: string; // 토스 결제 고유 키 (취소/조회 시 필수)
  orderId: string; // 우리 서버 주문 번호
  status: TossPaymentStatus; // 결제 처리 상태
  totalAmount: number; // 총 결제 금액
  balanceAmount: number; // 취소 가능 잔액 (환불 가능 여부 체크용)
  requestedAt: string; // 결제 요청 시각
  approvedAt: string | null; // 승인 완료 시각
  lastTransactionKey: string | null; // 마지막 거래 식별 키
  cancels: TossPaymentCancel[] | null; // 취소 이력 정보
}

export interface TossPaymentCancel {
  cancelAmount: number; // 취소된 금액
  cancelReason: string; // 취소 사유
  canceledAt: string; // 취소 시각
}

export interface TossErrorResponse {
  code: string; // 오류 코드 (예: ALREADY_PROCESSED_PAYMENT)
  message: string; // 오류 메시지
}
