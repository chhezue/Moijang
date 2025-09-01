// 공구 아이템
export interface GroupBuyingItem {
  id: string;
  title: string;
  productUrl: string;
  description: string;
  fixedCount: number;
  currentCount: number;
  totalPrice: number;
  estimatedPrice: number;
  shippingFee: number;
  account: string;
  bank: string;
  startDate: string;
  endDate: string;
  groupBuyingStatus: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  isOwner: boolean;
  isParticipant: boolean;
  leaderId: IUser;
  pickupPlace: string;
  pickupTime: string;
  participantInfo: {
    count: number;
    isPaid: boolean;
  };
  leaderCount: number;
  cancelReason: string;
  nonDepositors: IUser[];
}

// 공구 아이템 (생성용)
export interface CreateGroupBuying {
  title: string;
  productUrl: string;
  description: string;
  fixedCount: number;
  totalPrice: number;
  shippingFee: number;
  account: string;
  bank: string;
  endDate: string;
  category: string;
  leaderCount: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SearchParams extends PaginationParams {
  keyword?: string;
  status?: string;
  category?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// user 정보
export interface IUser {
  id: string;
  displayName: string;
  jobTitle: string;
  mail: string;
  department: string;
  userPrincipalName: string;
}

// participant 정보
export interface IParticipant {
  id: string;
  gbId: string;
  refundAccount: string;
  refundBank: string;
  count: number;
  isPaid: boolean;
  userId: {
    id: string;
    displayName: string;
    department: string;
  };
}

//은행 ENUM
export const BANK_NAMES = [
  "KB국민은행",
  "신한은행",
  "우리은행",
  "하나은행",
  "NH농협은행",
  "IBK기업은행",
  "SC제일은행",
  "카카오뱅크",
  "케이뱅크",
] as const;

//은행 ENUM 타입
export type BankName = (typeof BANK_NAMES)[number];
