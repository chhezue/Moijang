import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { UniversityService } from "../university/university.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";
import * as nodemailer from "nodemailer";
import { RequestSendCodeDto } from "./dto/request-send-code.dto";
import { ResponseSendCodeDto } from "./dto/response-send-code.dto";
import { RequestConfirmCodeDto } from "./dto/request-confirm-code.dto";
import { ResponseConfirmCodeDto } from "./dto/response-confirm-code.dto";
import { UserService } from "../user/user.service";
import { v4 as uuid } from "uuid";
import { VerificationRedisRepository } from "./verification.redis.repository";

@Injectable()
export class VerificationService {
  constructor(
    private readonly universityService: UniversityService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly verificationRepository: VerificationRedisRepository,
  ) {}

  async sendCode(dto: RequestSendCodeDto): Promise<ResponseSendCodeDto> {
    const { universityId, universityEmail } = dto;

    // 1. 대학교 정보 조회
    const university = await this.universityService.findById(universityId);
    if (!university?.domain) {
      throw new BadRequestException(
        "해당 대학교의 이메일 도메인 정보가 없어 인증을 진행할 수 없습니다.",
      );
    }

    const normalizedEmail = universityEmail.trim().toLowerCase();
    const [, emailDomain] = normalizedEmail.split("@");
    if (emailDomain !== university.domain.toLowerCase()) {
      throw new BadRequestException("학교 이메일 도메인이 일치하지 않습니다.");
    }

    // 2. 이메일 중복 검증
    const exist = await this.userService.existsByEmail(normalizedEmail);
    if (exist) {
      throw new BadRequestException(
        "이미 해당 이메일로 가입한 사용자가 존재합니다.",
      );
    }

    const code = this.generateVerificationCode(); // 6자리 인증 코드 생성
    const codeHash = this.hashCode(code);
    const verificationId = uuid();

    await this.verificationRepository.setSession(
      verificationId,
      {
        universityId,
        universityEmail: normalizedEmail,
        codeHash,
        attemptCount: 0,
        status: "PENDING",
      },
      900, // TTL 15분
    );

    const mailUser = this.configService.get<string>("MAIL_USER");
    const mailPass = this.configService.get<string>("MAIL_PASS");
    if (!mailUser || !mailPass) {
      throw new InternalServerErrorException(
        "메일 발송 설정이 누락되었습니다. MAIL_USER, MAIL_PASS를 확인해주세요.",
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: mailUser,
        pass: mailPass,
      },
    });

    try {
      await transporter.sendMail({
        from: mailUser,
        to: normalizedEmail,
        subject: "[모이장 학교 인증] 인증 코드",
        text: `인증 코드: ${code}`,
      });
    } catch {
      throw new InternalServerErrorException(
        "인증 코드 메일 발송에 실패했습니다.",
      );
    }

    return {
      verificationId,
    };
  }

  // 웹메일로 받은 코드 인증
  async confirmCode(
    dto: RequestConfirmCodeDto,
  ): Promise<ResponseConfirmCodeDto> {
    const verification = await this.verificationRepository.getSession(
      dto.verificationId,
    );

    // TTL이 만료되어 토큰이 삭제된 경우
    if (!verification || Object.keys(verification).length === 0) {
      throw new NotFoundException(
        "인증 요청이 만료되었거나 존재하지 않습니다.",
      );
    }

    if (verification.status !== "PENDING") {
      throw new BadRequestException(
        "이미 처리되었거나 잠긴 인증 요청입니다. 코드를 다시 요청해주세요.",
      );
    }

    // 인증 코드가 일치하지 않는 경우
    const codeHash = this.hashCode(dto.code);
    if (verification.codeHash !== codeHash) {
      const attemptCount = Number(verification.attemptCount) + 1;

      // 5회 이상 시도 시 잠김.
      if (attemptCount >= 5) {
        await this.verificationRepository.updateSession(dto.verificationId, {
          attemptCount,
          status: "LOCKED",
        });

        throw new ForbiddenException(
          "인증 시도 횟수를 초과했습니다. 인증 코드를 다시 요청해주세요.",
        );
      }

      // 코드가 틀렸을 경우 시도 횟수 +1
      await this.verificationRepository.updateSession(dto.verificationId, {
        attemptCount,
        status: "PENDING",
      });

      throw new BadRequestException("인증 코드가 올바르지 않습니다.");
    }

    // 인증 통과 시 Redis에서 세션 삭제
    await this.verificationRepository.deleteSession(dto.verificationId);

    const signupToken = this.jwtService.sign(
      {
        universityId: verification.universityId,
        universityEmail: verification.universityEmail,
        typ: "signup",
      },
      { expiresIn: "15m" },
    );

    return { signupToken };
  }

  private hashCode(code: string): string {
    return crypto.createHash("sha256").update(code).digest("hex");
  }

  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
