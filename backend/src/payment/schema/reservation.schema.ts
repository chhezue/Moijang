import { Prop, Schema, SchemaFactory, SchemaOptions } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

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
export class Reservation extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'GroupBuying' })
  gbId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userId: string;

  @Prop()
  count: number; // 선점 수량

  @Prop()
  orderId: string; // 해당 checkout의 Payment.orderId와 동일

  @Prop({
    type: Date,
    default: () => new Date(Date.now() + 5 * 60 * 1000), // 5분 뒤 삭제
    index: { expires: 0 }, // 필드에 적힌 시각이 되면 즉시 삭제하라는 설정
  })
  expiresAt: Date;
}

export const ReservationSchema = SchemaFactory.createForClass(Reservation);
ReservationSchema.virtual('id').get(function (this: any) {
  return this._id?.toString();
});
