import { Prop, Schema, SchemaFactory, SchemaOptions } from '@nestjs/mongoose';
import {
  CancelReason,
  GroupBuyingStatus,
  ProductCategory,
} from '../const/group-buying.const';
import { Document } from 'mongoose';

const options: SchemaOptions = {
  timestamps: true, // 기존에 사용하던 timestamps 옵션
  toJSON: {
    virtuals: true, // virtual 필드(id)를 JSON에 포함
  },
  toObject: {
    virtuals: true, // virtual 필드를 객체에 포함
  },
};

@Schema(options)
export class GroupBuying extends Document {
  @Prop()
  title: string;

  @Prop()
  productUrl: string;

  @Prop()
  description: string;

  @Prop()
  fixedCount: number;

  @Prop()
  totalPrice: number;

  @Prop()
  estimatedPrice: number;

  @Prop()
  shippingFee: number;

  @Prop()
  account: string;

  @Prop()
  bank: string;

  @Prop({ default: Date.now() })
  startDate: Date;

  @Prop()
  endDate: Date;

  @Prop({ type: String, ref: 'User' })
  leaderId: string;

  @Prop({
    enum: GroupBuyingStatus,
    default: GroupBuyingStatus.RECRUITING,
  })
  groupBuyingStatus: GroupBuyingStatus;

  @Prop({ enum: ProductCategory })
  category: ProductCategory;

  @Prop({ enum: CancelReason })
  cancelReason: CancelReason;

  @Prop({ type: [String], ref: 'User' })
  nonDepositors: string[];

  @Prop()
  pickupTime: string;

  @Prop()
  pickupPlace: string;

  @Prop({ type: Boolean, default: false })
  isReminderSent: boolean; // 👈 알림 발송 여부 필드 추가

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}
export const GroupBuyingSchema = SchemaFactory.createForClass(GroupBuying);
