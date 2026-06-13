// 공구 취소 시 PAID 건 환불 집계 결과
export enum RefundStatus {
  ALL_SUCCESS = 'allSuccess', // 전체 환불 성공
  PARTIAL_SUCCESS = 'partialSuccess', // 일부 환불 성공
  FAILED = 'failed', // 전체 환불 실패
}

// 결제 시도 단위 상태
export enum PaymentStatus {
  INITIATED = 'INITIATED', // checkout 직후
  PAID = 'PAID', // confirm 성공
  FAILED = 'FAILED', // PG 실패 또는 참여자 생성 실패 후 환불
  REFUNDED = 'REFUNDED', // 환불 완료
}
