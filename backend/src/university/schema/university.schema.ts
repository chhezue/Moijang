import { Prop, Schema, SchemaFactory, SchemaOptions } from "@nestjs/mongoose";
import { Document } from "mongoose";

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
export class University extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  domain: string;

  @Prop({ required: true })
  campusType: string;

  @Prop({ required: true })
  region: string;
}

export const UniversitySchema = SchemaFactory.createForClass(University);
UniversitySchema.virtual("id").get(function (this: any) {
  return this._id?.toString();
});
