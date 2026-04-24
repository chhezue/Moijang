import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from "@nestjs/common";
import { GetUserDto } from "../dto/get-user.dto";

export const UserDecorator = createParamDecorator(
  (data: keyof GetUserDto | undefined, context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user) {
      throw new InternalServerErrorException(
        "User decorator는 Guard와 함께 사용해야 합니다.",
      );
    }

    if (data) {
      return user[data];
    }

    return user;
  },
);
