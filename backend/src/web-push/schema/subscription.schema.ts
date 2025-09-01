import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ required: true })
  endpoint: string;

  @Prop({
    type: Object,
    required: true,
  })
  keys: {
    p256dh: string;
    auth: string;
  };

  @Prop({ type: Number, required: false, default: null })
  expirationTime?: number;

  @Prop({ type: String, ref: 'User', required: true })
  userId: string;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
