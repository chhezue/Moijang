import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { User } from '../schema/user.schema';

export const UserDecorator = createParamDecorator(
  (data: keyof User | undefined, context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();
    const user = req.user as User;

    if (!user) {
      throw new InternalServerErrorException(
        'User decorator는 Guard와 함께 사용해야 합니다.',
      );
    }

    // @UserDecorator('id') 처럼 인자가 주어졌을 경우 user.id 반환
    if (data) {
      return user[data];
    }

    // @UserDecorator() 처럼 인자가 주어지지 않았을 경우 user 객체 전체 반환
    return user;
  },
);
