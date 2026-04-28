import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  Param,
} from "@nestjs/common";
import { Response, Request } from "express";
import { AuthService } from "./auth.service";
import { ApiOperation } from "@nestjs/swagger";
import { UserDecorator } from "../user/decorator/user.decorator";
import { JwtAuthGuard } from "./guard/auth.guard";
import { GetUserDto } from "../user/dto/get-user.dto";
import { SignupDto } from "./dto/signup.dto";
import { LoginDto } from "./dto/login.dto";
import { UserService } from "../user/user.service";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @ApiOperation({ summary: "회원가입" })
  @Post("signup")
  async signup(@Body() dto: SignupDto): Promise<GetUserDto> {
    return this.authService.signup(dto);
  }

  @ApiOperation({ summary: "회원가입 시 중복 아이디 검증" })
  @Get("exist/:loginId")
  async existsByLoginId(@Param("loginId") loginId: string): Promise<boolean> {
    return this.userService.existsByLoginId(loginId);
  }

  @ApiOperation({ summary: "로그인" })
  @Post("login")
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<GetUserDto> {
    return this.authService.login(dto, res);
  }

  @ApiOperation({ summary: "로그아웃" })
  @UseGuards(JwtAuthGuard)
  @Post("logout")
  async logout(@Res() res: Response) {
    await this.authService.logout(res); // 서비스 레이어에서 쿠키 삭제
    return res.json({
      message: "로그아웃 성공",
    });
  }

  @ApiOperation({ summary: "현재 로그인한 유저의 정보 반환" })
  @UseGuards(JwtAuthGuard)
  @Get("me")
  async getCurrentUser(@UserDecorator() user: GetUserDto) {
    return user;
  }

  // 클라이언트에서 명시적으로 토큰 갱신하는 경우
  @ApiOperation({ summary: "액세스 토큰 검증" })
  @Get("access_token")
  getAccessToken(@Req() req: Request) {
    return this.authService.validateAccessToken(req);
  }

  // 클라이언트에서 명시적으로 토큰 갱신하는 경우
  @ApiOperation({ summary: "액세스 토큰 검증 후 리프레시 토큰 재발급" })
  @Get("refresh_token")
  async getRefreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.validateRefreshToken(req, res);
  }
}
