import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../schema/user.schema';

export const OptionalUserDecorator = createParamDecorator(
  (data: keyof User | undefined, context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();
    const user = req.user as User | null;

    // 유저가 없는 경우 null 반환 (에러를 던지지 않음)
    if (!user) {
      return null;
    }

    // @OptionalUserDecorator('id') 처럼 인자가 주어졌을 경우 user.id 반환
    if (data) {
      return user[data];
    }

    // @OptionalUserDecorator() 처럼 인자가 주어지지 않았을 경우 user 객체 전체 반환
    return user;
  },
);
