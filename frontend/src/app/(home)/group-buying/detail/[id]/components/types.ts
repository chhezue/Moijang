export type ModalType =
  | null
  // 참여자 측
  | "participation" // 참여
  | "cancelParticipation" // 참여 취소
  // 주최자 측
  | "editGroupBuying" // 공동구매 수정
  | "cancelGroupBuying" // 공동구매 취소 (모집 중)
  | "order" // 주문하기 (CONFIRMED → ORDERED)
  | "cancelForPayment" // 주문 중 취소
  | "shipped" // 배송 완료 및 공지
  | "editShipped" // 수령장소시간 수정
  | "completeGroupBuying"; // 공구 완료(종료)
