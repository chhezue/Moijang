import { Prop, Schema, SchemaFactory, SchemaOptions } from "@nestjs/mongoose";
import {
  CancelReason,
  GroupBuyingStatus,
  ProductCategory,
} from "../const/group-buying.const";
import { Document, Schema as MongooseSchema } from "mongoose";

const options: SchemaOptions = {
  timestamps: true,
  versionKey: false,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret) => {
      delete ret._id;
      return ret;
    },
  },
  toObject: {
    virtuals: true,
    transform: (_doc, ret) => {
      delete ret._id;
      return ret;
    },
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

  @Prop({ default: Date.now })
  startDate: Date;

  @Prop()
  endDate: Date;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: "User",
    required: true,
  })
  leaderId: MongooseSchema.Types.ObjectId;

  @Prop({
    enum: GroupBuyingStatus,
    default: GroupBuyingStatus.RECRUITING,
  })
  groupBuyingStatus: GroupBuyingStatus;

  @Prop({ enum: ProductCategory })
  category: ProductCategory;

  @Prop({ enum: CancelReason })
  cancelReason: CancelReason;

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
GroupBuyingSchema.virtual("id").get(function (this: any) {
  return this._id?.toString();
});
