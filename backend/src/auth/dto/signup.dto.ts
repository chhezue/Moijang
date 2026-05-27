import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SignupDto {
  @ApiProperty({ description: '로그인 아이디' })
  @IsString()
  loginId: string;

  @ApiProperty({ description: '비밀번호' })
  @IsString()
  password: string;

  @ApiProperty({ description: '실명' })
  @IsString()
  name: string;

  @ApiProperty({ description: '이메일 인증 완료 후 발급된 회원가입 토큰' })
  @IsString()
  signupToken: string; // 토큰 해독 시 universityId, universityEmail 얻을 수 있음.

  @ApiProperty({ description: '은행' })
  @IsString()
  bankName: string;

  @ApiProperty({ description: '계좌' })
  @IsString()
  bankAccount: string;
}
