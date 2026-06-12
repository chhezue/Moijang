import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ResponseConfirmCodeDto {
  @ApiProperty({ description: '이메일 인증 성공 후 발급된 회원가입 토큰' })
  @IsString()
  signupToken: string;
}
