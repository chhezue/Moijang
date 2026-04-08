import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class University extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({required: false})
  domain: string;

  @Prop()
  campusType: string;

  @Prop()
  region: string;
}

export const UniversitySchema = SchemaFactory.createForClass(University);
