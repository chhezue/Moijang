import { Prop, Schema, SchemaFactory, SchemaOptions } from '@nestjs/mongoose';
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
export class Participant extends Document {
  @Prop({ type: String, ref: 'User' })
  userId: string;

  @Prop({ type: String, ref: 'GroupBuying' })
  gbId: string;

  @Prop({ default: false })
  isPaid: boolean;

  @Prop()
  refundAccount: string;

  @Prop()
  refundBank: string;

  @Prop()
  count: number;

  // @Prop()
  // confirmedPrice: number;

  @Prop({ default: () => Date.now() })
  joinedDate: Date;
}
export const ParticipantSchema = SchemaFactory.createForClass(Participant);
