import { Prop, Schema, SchemaFactory, SchemaOptions } from "@nestjs/mongoose";
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
export class User extends Document {
  @Prop({ required: true, unique: true })
  loginId: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  displayName: string;

  @Prop({ required: true, unique: true })
  universityEmail: string;

  @Prop({ required: true })
  studentNo: string;

  @Prop({ default: true })
  isVerified: boolean;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: "University",
    required: true,
  })
  universityId: MongooseSchema.Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.virtual("id").get(function (this: any) {
  return this._id?.toString();
});
