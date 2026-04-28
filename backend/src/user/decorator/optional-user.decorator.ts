import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { GetUserDto } from "../dto/get-user.dto";

export const OptionalUserDecorator = createParamDecorator(
  (data: keyof GetUserDto | undefined, context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user) {
      return null;
    }

    if (data) {
      return user[data];
    }

    return user;
  },
);
