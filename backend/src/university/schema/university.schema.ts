import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class University extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  domain: string;
}

export const UniversitySchema = SchemaFactory.createForClass(University);
