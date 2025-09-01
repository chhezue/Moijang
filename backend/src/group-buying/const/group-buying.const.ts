export enum GroupBuyingStatus {
  RECRUITING = 'RECRUITING', // 모집 중
  CONFIRMED = 'CONFIRMED', // 모집 완료
  PAYMENT_IN_PROGRESS = 'PAYMENT_IN_PROGRESS', // 입금 진행 중
  ORDER_PENDING = 'ORDER_PENDING', // 주문 대기
  ORDERED = 'ORDERED', // 주문 진행 중
  SHIPPED = 'SHIPPED', // 배송 완료
  CANCELLED = 'CANCELLED', // 공구 취소
  COMPLETED = 'COMPLETED', // 공구 완료
}

export enum ProductCategory {
  DIGITAL_DEVICE = 'DIGITAL_DEVICE', // 디지털기기
  HOME_APPLIANCE = 'HOME_APPLIANCE', // 생활가전
  FURNITURE_INTERIOR = 'FURNITURE_INTERIOR', // 가구/인테리어
  CHILDREN = 'CHILDREN', // 유아동
  FOOD = 'FOOD', // 생활/가공식품
  CHILDREN_BOOK = 'CHILDREN_BOOK', // 유아도서
  SPORTS_LEISURE = 'SPORTS_LEISURE', // 스포츠/레저
  WOMEN_ACCESSORIES = 'WOMEN_ACCESSORIES', // 여성잡화
  WOMEN_CLOTHING = 'WOMEN_CLOTHING', // 여성의류
  MEN_FASHION = 'MEN_FASHION', // 남성패션/잡화
  GAME_HOBBY = 'GAME_HOBBY', // 게임/취미
  BEAUTY = 'BEAUTY', // 뷰티/미용
  PET_SUPPLIES = 'PET_SUPPLIES', // 반려동물용품
  BOOK_TICKET_MUSIC = 'BOOK_TICKET_MUSIC', // 도서/티켓/음반
  PLANT = 'PLANT', // 식물
  ETC = 'ETC', // 기타 중고물품
}

export enum CancelReason {
  LEADER_CANCELLED = 'LEADER_CANCELLED', // 총대 개인 사유
  RECRUITMENT_FAILED = 'RECRUITMENT_FAILED', // 모집 인원 미달
  PAYMENT_FAILED = 'PAYMENT_FAILED', // 미입금자 발생
  PRODUCT_UNAVAILABLE = 'PRODUCT_UNAVAILABLE', // 상품 품절 또는 가격 변동
  SYSTEM_CANCELLED = 'SYSTEM_CANCELLED', // 시스템 자동 취소 (ex: 시간 초과)
}

// Key-Label 매핑 객체들
export const GROUP_BUYING_STATUS_LABELS = {
  [GroupBuyingStatus.RECRUITING]: '모집 중',
  [GroupBuyingStatus.CONFIRMED]: '모집 완료',
  [GroupBuyingStatus.PAYMENT_IN_PROGRESS]: '입금 진행 중',
  [GroupBuyingStatus.ORDER_PENDING]: '주문 대기',
  [GroupBuyingStatus.ORDERED]: '주문 진행 중',
  [GroupBuyingStatus.SHIPPED]: '배송 완료',
  [GroupBuyingStatus.CANCELLED]: '공구 취소',
  [GroupBuyingStatus.COMPLETED]: '공구 완료',
};

export const PRODUCT_CATEGORY_LABELS = {
  [ProductCategory.DIGITAL_DEVICE]: '디지털기기',
  [ProductCategory.HOME_APPLIANCE]: '생활가전',
  [ProductCategory.FURNITURE_INTERIOR]: '가구/인테리어',
  [ProductCategory.CHILDREN]: '유아동',
  [ProductCategory.FOOD]: '생활/가공식품',
  [ProductCategory.CHILDREN_BOOK]: '유아도서',
  [ProductCategory.SPORTS_LEISURE]: '스포츠/레저',
  [ProductCategory.WOMEN_ACCESSORIES]: '여성잡화',
  [ProductCategory.WOMEN_CLOTHING]: '여성의류',
  [ProductCategory.MEN_FASHION]: '남성패션/잡화',
  [ProductCategory.GAME_HOBBY]: '게임/취미',
  [ProductCategory.BEAUTY]: '뷰티/미용',
  [ProductCategory.PET_SUPPLIES]: '반려동물용품',
  [ProductCategory.BOOK_TICKET_MUSIC]: '도서/티켓/음반',
  [ProductCategory.PLANT]: '식물',
  [ProductCategory.ETC]: '기타',
};

export const CANCEL_REASON_LABELS = {
  [CancelReason.LEADER_CANCELLED]: '총대 개인 사유',
  [CancelReason.RECRUITMENT_FAILED]: '모집 인원 미달',
  [CancelReason.PAYMENT_FAILED]: '미입금자 발생',
  [CancelReason.PRODUCT_UNAVAILABLE]: '상품 품절 또는 가격 변동',
  [CancelReason.SYSTEM_CANCELLED]: '시스템 자동 취소',
};

// 헬퍼 함수 - enum을 key-label 배열로 변환
export const getEnumOptions = (
  enumObject: any,
  labels: Record<string, string>,
) => {
  return Object.values(enumObject).map((key) => ({
    key,
    label: labels[key as string],
  }));
};
