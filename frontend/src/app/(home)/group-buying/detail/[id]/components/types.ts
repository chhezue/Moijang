export type ModalType =
  | null
  // 참여자 측
  | "participation" // 참여/정보 수정
  | "cancelParticipation" // 참여 취소
  | "confirmPayment" // 입금 완료 확인
  // 주최자 측
  | "editGroupBuying" // 공동구매 수정
  | "cancelGroupBuying" // 공동구매 취소
  | "requestPayment" // 결제 요청 보내기
  | "order" // 주문하기
  | "cancelForPayment" // 미결제로 인한 취소
  | "shipped" // 배송 완료 및 공지
  | "editShipped" // 수령장소시간 수정
  | "editPrice" // 가격만 수정
  | "completeGroupBuying"; //공구 완료(종료)
