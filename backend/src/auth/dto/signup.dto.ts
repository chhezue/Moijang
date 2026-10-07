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

  // 계좌이체 결제 방식 때 쓰던 필드. Toss PG 연동(#20) 이후 환불도 paymentKey 기반으로 바뀌어
  // 더 이상 어디서도 참조되지 않음 — 주석 처리, 당분간 복구 필요 없으면 완전히 삭제할 것
  // @ApiProperty({ description: '은행' })
  // @IsString()
  // bankName: string;

  // @ApiProperty({ description: '계좌' })
  // @IsString()
  // bankAccount: string;
}
