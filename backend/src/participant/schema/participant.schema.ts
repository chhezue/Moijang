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
export class Participant extends Document {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'GroupBuying',
    required: true,
  })
  gbId: MongooseSchema.Types.ObjectId;

  @Prop()
  count: number;

  @Prop({ default: () => Date.now() })
  joinedDate: Date;
}

export const ParticipantSchema = SchemaFactory.createForClass(Participant);

// gbId와 userId의 조합은 DB에 유일하게 존재한다. (동시성/조회 성능 문제 해결)
ParticipantSchema.index({ gbId: 1, userId: 1 }, { unique: true });
ParticipantSchema.virtual('id').get(function (this: any) {
  return this._id?.toString();
});
