// 공구 응답에 embedded되는 유저 객체
export interface IUser {
  id: string;
  displayName: string;
  department: string;
}

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
