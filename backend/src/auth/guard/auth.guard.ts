import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { Request, Response } from 'express';
import { UserService } from '../../user/user.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // 검증은 service 레이어 호출하여 진행
    // 반환된 user의 정보는 request 객체에 주입해서 반환 -> 컨트롤러에서 활용 가능
    try {
      // 먼저 액세스 토큰 검증 시도
      const { id } = await this.authService.validateAccessToken(request);
      request.user = await this.userService.getUserByUuid(id);

      return true;
    } catch {
      // 액세스 토큰이 만료되었거나 유효하지 않은 경우 리프레시 토큰으로 재시도
      try {
        const { id } = await this.authService.validateRefreshToken(
          request,
          response,
        );
        request.user = await this.userService.getUserByUuid(id);

        return true;
      } catch {
        // 리프레시 토큰도 유효하지 않은 경우 인증 실패
        throw new UnauthorizedException(
          '인증이 필요합니다. 다시 로그인해 주세요.',
        );
      }
    }
  }
}
