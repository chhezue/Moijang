import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { VerificationService } from './verification.service';
import { RequestSendCodeDto } from './dto/request-send-code.dto';
import { ResponseSendCodeDto } from './dto/response-send-code.dto';
import { RequestConfirmCodeDto } from './dto/request-confirm-code.dto';
import { ResponseConfirmCodeDto } from './dto/response-confirm-code.dto';

@ApiTags('verification')
@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @ApiOperation({ summary: '학교 이메일 인증 코드 발송' })
  @Post('send-code')
  async sendCode(@Body() dto: RequestSendCodeDto): Promise<ResponseSendCodeDto> {
    return this.verificationService.sendCode(dto);
  }

  @ApiOperation({ summary: '학교 이메일 인증 코드 확인 및 회원가입 토큰 발급' })
  @Post('confirm-code')
  async confirmCode(@Body() dto: RequestConfirmCodeDto): Promise<ResponseConfirmCodeDto> {
    return this.verificationService.confirmCode(dto);
  }
}
