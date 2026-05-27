// 결제 시도 단위 상태
export enum PaymentStatus {
  INITIATED = 'INITIATED', // 결제 의도 생성·checkout 직후
  REDIRECTED = 'REDIRECTED', // PG 결제 UI로 이동한 뒤(이탈 추적용)
  PAID = 'PAID', // 서버 검증·웹훅 등으로 결제 확정
  FAILED = 'FAILED', // PG 실패
  ABANDONED = 'ABANDONED', // 사용자 이탈 등 비정상 종료
  EXPIRED = 'EXPIRED', // TTL·스케줄 만료
  SUPERSEDED = 'SUPERSEDED', // 수량 변경·재시도로 대체됨
  REFUNDED = 'REFUNDED', // 전액 환불·취소 완료
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.INITIATED]: '결제 시작',
  [PaymentStatus.REDIRECTED]: '결제창 이동',
  [PaymentStatus.PAID]: '결제 완료',
  [PaymentStatus.FAILED]: '결제 실패',
  [PaymentStatus.ABANDONED]: '결제 이탈',
  [PaymentStatus.EXPIRED]: '결제 만료',
  [PaymentStatus.SUPERSEDED]: '재시도로 대체',
  [PaymentStatus.REFUNDED]: '환불 완료',
};

// 헬퍼 함수 - enum을 key-label 배열로 변환
export const getEnumOptions = (enumObject: any, labels: Record<string, string>) => {
  return Object.values(enumObject).map((key) => ({
    key,
    label: labels[key as string],
  }));
};
