import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import {
  AccessTokenPayload,
  RefreshTokenPayload,
  SignupTokenPayload,
} from './types/token-payload.type';
import { GetUserDto } from '../user/dto/get-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  // 회원가입 (이메일/아이디 모두 검증된 이후 실행됨.)
  async signup(dto: SignupDto): Promise<GetUserDto> {
    // 1) 토큰 검증
    let payload: SignupTokenPayload;

    try {
      payload = this.jwtService.verify<SignupTokenPayload>(dto.signupToken, {
        secret: this.configService.get('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('유효하지 않은 회원가입 토큰입니다.');
    }

    const { universityId, universityEmail, typ } = payload;

    // 2) 토큰 용도 검증
    if (typ !== 'signup') {
      throw new UnauthorizedException('잘못된 회원가입 토큰입니다.');
    }

    // 3) 필수 값 검증
    if (!universityId || !universityEmail) {
      throw new BadRequestException('회원가입 토큰에 필요한 정보가 누락되었습니다.');
    }

    // 4) 비밀번호 해싱 및 유저 생성
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const createUserDto: CreateUserDto = {
      loginId: dto.loginId,
      name: dto.name,
      universityEmail,
      universityId,
      bankName: dto.bankName,
      bankAccount: dto.bankAccount,
    };

    return await this.userService.createUser(createUserDto, hashedPassword);
  }

  async login(dto: LoginDto, res: Response): Promise<GetUserDto> {
    // loginId, password 포함
    const user = await this.userService.getUserByLoginIdWithPassword(dto.loginId);

    if (!user) {
      throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다.');
    }

    // res 응답에 쿠키 삽입
    const userId = user.id;

    const accessToken = this.jwtService.sign(
      {
        typ: 'access',
        sub: userId,
        name: user.name,
      } satisfies AccessTokenPayload,
      { expiresIn: '5m' },
    );
    const refreshToken = this.jwtService.sign(
      {
        typ: 'refresh',
        sub: userId,
        name: user.name,
      } satisfies RefreshTokenPayload,
      { expiresIn: '14d' },
    );

    this.setTokenCookies(res, accessToken, refreshToken);

    return this.userService.getUserById(userId);
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

      const decodedAccessToken = this.jwtService.verify<AccessTokenPayload>(accessToken, {
        secret: this.configService.get('JWT_SECRET'),
      });

      if (decodedAccessToken.typ !== 'access') {
        throw new UnauthorizedException('유효하지 않은 토큰입니다.');
      }

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

      const decodedRefreshToken = this.jwtService.verify<RefreshTokenPayload>(refreshToken, {
        secret: this.configService.get('JWT_SECRET'),
      });
      if (!decodedRefreshToken) {
        throw new UnauthorizedException('유효하지 않은 토큰입니다.');
      }

      if (decodedRefreshToken.typ !== 'refresh') {
        throw new UnauthorizedException('유효하지 않은 토큰입니다.');
      }

      const userId = decodedRefreshToken.sub;

      const accessToken = this.jwtService.sign(
        {
          typ: 'access',
          sub: userId,
          name: decodedRefreshToken.name,
        } satisfies AccessTokenPayload,
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
