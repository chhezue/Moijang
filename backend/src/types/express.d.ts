import type { GetUserDto } from '../user/dto/get-user.dto';

declare global {
  namespace Express {
    interface Request {
      /** JwtAuthGuard / OptionalJwtAuthGuard에서 `UserService.getUserById` 결과로 주입 */
      user?: GetUserDto | null;
    }
  }
}

export {};
