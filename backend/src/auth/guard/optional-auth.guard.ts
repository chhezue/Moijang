import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { Request, Response } from 'express';
import { UserService } from '../../user/user.service';

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    try {
      // 먼저 액세스 토큰 검증 시도
      const { id } = await this.authService.validateAccessToken(request);

      request.user = await this.userService.getUserByUuid(id);
      return true;
    } catch {
      // 액세스 토큰이 없거나 유효하지 않은 경우 리프레시 토큰으로 재시도
      try {
        const { id } = await this.authService.validateRefreshToken(
          request,
          response,
        );

        request.user = await this.userService.getUserByUuid(id);
        return true;
      } catch {
        // 인증 실패 시에도 에러를 발생시키지 않고 request.user를 null로 설정
        request.user = null;
        return true; // 항상 true 반환하여 요청이 진행되도록 함
      }
    }
  }
}
