// 결제 시도 단위 상태
export enum PaymentStatus {
  INITIATED = 'INITIATED', // checkout 직후
  PAID = 'PAID', // confirm 성공
  FAILED = 'FAILED', // PG 실패 또는 참여자 생성 실패 후 환불
  REFUNDED = 'REFUNDED', // 환불 완료
}
