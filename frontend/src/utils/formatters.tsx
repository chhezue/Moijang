// 금액 포맷 함수
export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(value);

// 디데이 포맷 함수
export const calcDday = (endDate: string) => {
  const end = new Date(endDate);
  // D-day 계산 시 시간은 제외하고 날짜만 비교하기 위해 시작 시간으로 맞춤
  end.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diff = Math.ceil(
    (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diff > 0) return `D-${diff}`;
  if (diff === 0) return "D-DAY";
  return `종료`;
};
