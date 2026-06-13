import { Prop, Schema, SchemaFactory, SchemaOptions } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { PaymentStatus } from '../const/payment.const';

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

// 사용자가 결제 버튼을 누른 순간부터 최종 성공/실패까지의 과정
@Schema(options)
export class Payment extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'GroupBuying', required: true })
  gbId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop()
  orderId: string; // 서버에서 발급한 unique 주문 번호 (멱등성 보장)

  @Prop()
  paymentKey?: string; // 토스에서 발급한 unique key (confirm, cancel 시 필요)

  @Prop()
  amount: number; // 결제 총 금액 (단가 * 수량)

  @Prop({ enum: PaymentStatus })
  status: PaymentStatus;

  @Prop()
  countSnapshot: number; // checkout 시점 구매 수량 스냅샷

  @Prop()
  unitPriceSnapshot: number; // checkout 시점 구매 단가 스냅샷

  @Prop()
  paidAt?: Date;

  @Prop()
  refundedAt?: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
PaymentSchema.virtual('id').get(function (this: any) {
  return this._id?.toString();
});
