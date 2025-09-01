import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class User {
  @Prop()
  id: string;

  @Prop()
  displayName: string;

  @Prop()
  jobTitle: string;

  @Prop()
  mail: string;

  @Prop()
  department: string;

  @Prop()
  userPrincipalName: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
