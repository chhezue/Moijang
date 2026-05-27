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
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Participant', required: false })
  participantId?: string; // 최종 승인(PAID) 성공 시 생성된 참여자 정보와 연결

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'GroupBuying', required: true })
  gbId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop()
  orderId: string; // 서버에서 발급한 unique 주문 번호 (멱등/매칭용)

  @Prop()
  paymentKey?: string; // 토스 측 결제 고유 키 (결제된 후에 발급됨.)

  @Prop()
  amount: number; // 결제 총 금액 (단가 * 수량)

  @Prop({ enum: PaymentStatus })
  status: PaymentStatus;

  @Prop()
  attemptNo: number; // 결제 시도 횟수 (최신 시도/결제 장애 추적)

  @Prop()
  countSnapshot: number; // 결제 시도 시점 수량 스냅샷 (가격 변동 감지, 정원 선점 및 해제)

  @Prop()
  unitPriceSnapshot: number; // 결제 시도 시점 단가 스냅샷 (가격 변동 감지, 정원 선점 및 해제)

  @Prop()
  active: boolean; // "현재 진행 중인 유효한 결제창인가?" (새 결제 시도 시 이전 건은 false가 됨)

  @Prop()
  paidAt: Date; // 최종 결제 완료 시각

  @Prop()
  refundedAt: Date; // 환불이 발생한 시각

  @Prop({ type: Object })
  pgRawResponse: Record<string, any>; // PG사 원본 응답 (추적/디버깅용)
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
PaymentSchema.virtual('id').get(function (this: any) {
  return this._id?.toString();
});
