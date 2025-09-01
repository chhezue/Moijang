import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayloadDto } from './dto/jwt-payload.dto';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { TeamsAuthEndDto } from './dto/teams-auth-end.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  // 사용자 로그인 성공하면 JWT 토큰 생성
  async login(user: TeamsAuthEndDto, res: Response): Promise<TeamsAuthEndDto> {
    // JWT payload 생성
    const payload: JwtPayloadDto = {
      sub: user.id, // uuid
      name: user.displayName, // displayName
    };

    // 토큰 생성
    const accessToken = this.jwtService.sign(payload, { expiresIn: '5m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '14d' });

    // Response Header의 쿠키에 토큰 저장 -> 다음 요청 시 자동으로 쿠키 전송
    this.setTokenCookies(res, accessToken, refreshToken);

    // Response Body로 사용자 정보 반환(JSON 형태) -> 프론트가 직접 조작 가능
    return user;
  }

  // Teams 인증 콜백 처리
  async handleTeamsCallback(
    query: any,
    res: Response,
  ): Promise<TeamsAuthEndDto> {
    const currentUser = await this.userService.upsertUser(query);

    // 로그인 처리 (JWT 토큰 생성 및 쿠키 설정)
    const loginUser = await this.login(currentUser, res);
    if (!loginUser) {
      throw new InternalServerErrorException(
        '로그인 처리 중 오류가 발생했습니다.',
      );
    }

    return loginUser;
  }

  // 생성된 쿠키를 응답의 cookie로 설정
  setTokenCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      maxAge: 5 * 60 * 1000, // 5분
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14일
    });
  }

  // 로그아웃 시 쿠키에서 토큰 삭제
  async logout(res: Response) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return { success: true };
  }

  // 액세스 토큰 검증
  async validateAccessToken(req: Request) {
    try {
      const { accessToken } = req.cookies;

      const decodedAccessToken = this.jwtService.verify(accessToken, {
        secret: this.configService.get('JWT_SECRET'),
      });

      // 검증 후 사용자 정보 반환 -> 가드에서 Request 객체에 할당
      return {
        id: decodedAccessToken.sub,
        name: decodedAccessToken.name,
      };
    } catch {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
  }

  // 리프레시 토큰 검증 후 액세스 토큰 재발급
  async validateRefreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.cookies;
      if (!refreshToken) {
        throw new UnauthorizedException('유효하지 않은 토큰입니다.');
      }

      const decodedRefreshToken = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_SECRET'),
      });
      if (!decodedRefreshToken) {
        throw new UnauthorizedException('유효하지 않은 토큰입니다.');
      }

      const userId = decodedRefreshToken.sub;

      const accessToken = this.jwtService.sign(
        { sub: userId, name: decodedRefreshToken.name },
        { expiresIn: '5m' },
      );

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: this.configService.get<string>('NODE_ENV') === 'production',
        sameSite: 'lax',
        maxAge: 5 * 60 * 1000,
      });

      // 검증 후 사용자 정보 반환 -> 가드에서 Request 객체에 할당
      return {
        id: userId,
        name: decodedRefreshToken.name,
      };
    } catch {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
  }

  // 현재 로그인한 사용자 정보 반환
  // async getCurrentUser(id: string): Promise<TeamsAuthEndDto> {
  //   const decodedAccessToken = this.jwtService.verify(accessToken, {
  //     secret: this.configService.get('JWT_SECRET'),
  //   });
  //
  //   if (decodedAccessToken) {
  //     return await this.userService.getUserByUuid(decodedAccessToken.sub);
  //   } else {
  //     throw new NotFoundException('해당하는 사용자를 찾을 수 없습니다.');
  //   }
  // }
}
