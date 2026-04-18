import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request, Response } from "express";
import { ConfigService } from "@nestjs/config";
import { UserService } from "../user/user.service";
import { SignupDto } from "./dto/signup.dto";
import { CreateUserDto } from "../user/dto/create-user.dto";
import * as bcrypt from "bcrypt";
import { SignupTokenPayload } from "./types/token-payload.type";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  // 회원가입 (이메일/아이디 모두 검증된 이후 실행됨.)
  async signup(dto: SignupDto) {
    // 1) 토큰 검증
    let payload: SignupTokenPayload;

    try {
      payload = this.jwtService.verify<SignupTokenPayload>(dto.signupToken, {
        secret: this.configService.get("JWT_SECRET"),
      });
    } catch {
      throw new UnauthorizedException("유효하지 않은 회원가입 토큰입니다.");
    }

    const { universityId, universityEmail, typ } = payload;

    // 3) 토큰 용도 검증
    if (typ !== "signup") {
      throw new UnauthorizedException("잘못된 회원가입 토큰입니다.");
    }

    // 4) 필수 값 검증
    if (!universityId || !universityEmail) {
      throw new BadRequestException(
        "회원가입 토큰에 필요한 정보가 누락되었습니다.",
      );
    }

    // 5) 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 6) 유저 생성
    const createUserDto: CreateUserDto = {
      loginId: dto.loginId,
      name: dto.name,
      universityEmail,
      universityId,
    };

    const createdUser = await this.userService.createUser(
      createUserDto,
      hashedPassword,
    );

    return createdUser;
  }

  // 생성된 쿠키를 응답의 cookie로 설정
  setTokenCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: this.configService.get<string>("NODE_ENV") === "production",
      sameSite: "lax",
      maxAge: 5 * 60 * 1000, // 5분
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: this.configService.get<string>("NODE_ENV") === "production",
      sameSite: "lax",
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14일
    });
  }

  // 로그아웃 시 쿠키에서 토큰 삭제
  async logout(res: Response) {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return { success: true };
  }

  // 액세스 토큰 검증
  async validateAccessToken(req: Request) {
    try {
      const { accessToken } = req.cookies;

      const decodedAccessToken = this.jwtService.verify(accessToken, {
        secret: this.configService.get("JWT_SECRET"),
      });

      // 검증 후 사용자 정보 반환 -> 가드에서 Request 객체에 할당
      return {
        id: decodedAccessToken.sub,
        name: decodedAccessToken.name,
      };
    } catch {
      throw new UnauthorizedException("유효하지 않은 토큰입니다.");
    }
  }

  // 리프레시 토큰 검증 후 액세스 토큰 재발급
  async validateRefreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.cookies;
      if (!refreshToken) {
        throw new UnauthorizedException("유효하지 않은 토큰입니다.");
      }

      const decodedRefreshToken = this.jwtService.verify(refreshToken, {
        secret: this.configService.get("JWT_SECRET"),
      });
      if (!decodedRefreshToken) {
        throw new UnauthorizedException("유효하지 않은 토큰입니다.");
      }

      const userId = decodedRefreshToken.sub;

      const accessToken = this.jwtService.sign(
        { sub: userId, name: decodedRefreshToken.name },
        { expiresIn: "5m" },
      );

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: this.configService.get<string>("NODE_ENV") === "production",
        sameSite: "lax",
        maxAge: 5 * 60 * 1000,
      });

      // 검증 후 사용자 정보 반환 -> 가드에서 Request 객체에 할당
      return {
        id: userId,
        name: decodedRefreshToken.name,
      };
    } catch {
      throw new UnauthorizedException("유효하지 않은 토큰입니다.");
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
