// 공구 응답에 embedded되는 유저 객체
export interface IUser {
  id: string;
  name: string;
}

export interface IParticipant {
  id: string;
  gbId: string;
  count: number;
  userId: {
    id: string;
    name: string;
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
  };
  leaderCount: number;
  cancelReason: string;
}

export interface CreateGroupBuying {
  title: string;
  productUrl: string;
  description: string;
  fixedCount: number;
  totalPrice: number;
  shippingFee: number;
  endDate: string;
  category: string;
  leaderCount: number;
}
