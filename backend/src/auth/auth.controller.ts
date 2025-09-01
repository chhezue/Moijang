import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { TeamsAuthEndDto } from './dto/teams-auth-end.dto';
import { ApiOperation } from '@nestjs/swagger';
import { UserDecorator } from '../user/decorator/user.decorator';
import { UserDto } from '../user/dto/user.dto';
import { JwtAuthGuard } from './guard/auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: '팀즈 로그인' })
  @Get('login')
  async login(@Res() res: Response) {
    const callbackUrl =
      process.env.TEAMS_LOGIN_CALLBACK_URL ??
      'http://localhost:3001/api/auth/callback';
    const teamsAuthUrl = `${process.env.TEAMS_AUTH_URL}?redirectUrl=${encodeURIComponent(callbackUrl)}`;
    res.redirect(teamsAuthUrl);
  }

  @ApiOperation({ summary: '팀즈 로그인 콜백 함수' })
  @Get('callback')
  async callback(@Query() query: TeamsAuthEndDto, @Res() res: Response) {
    try {
      const loginUser = await this.authService.handleTeamsCallback(query, res);

      if (loginUser) {
        try {
          return res.redirect(`${process.env.FRONT_URL}`);
        } catch (error) {
          console.log('redirectUrl 파싱 실패:', error);
        }
      } else {
        // loginUser가 없는 경우 (로그인 실패)
        console.error('사용자를 찾을 수 없습니다.');
        const errorUrl = `${process.env.FRONT_URL}/sign-in?error=login_failed`;
        return res.redirect(errorUrl);
      }
    } catch (error) {
      console.error('로그인 처리 중 오류:', error);
      const errorUrl = `${process.env.FRONT_URL}/sign-in?error=login_failed`;
      return res.redirect(errorUrl);
    }
  }

  @ApiOperation({ summary: '로그아웃' })
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Res() res: Response) {
    await this.authService.logout(res); // 서비스 레이어에서 쿠키 삭제
    return res.json({
      message: '로그아웃 성공',
    });
  }

  @ApiOperation({ summary: '현재 로그인한 유저의 정보 반환' })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getCurrentUser(@UserDecorator() user: UserDto) {
    return user;
  }

  // 클라이언트에서 명시적으로 토큰 갱신하는 경우
  @ApiOperation({ summary: '액세스 토큰 검증' })
  @Get('access_token')
  getAccessToken(@Req() req: Request) {
    return this.authService.validateAccessToken(req);
  }

  // 클라이언트에서 명시적으로 토큰 갱신하는 경우
  @ApiOperation({ summary: '액세스 토큰 검증 후 리프레시 토큰 재발급' })
  @Get('refresh_token')
  async getRefreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.validateRefreshToken(req, res);
  }
}
