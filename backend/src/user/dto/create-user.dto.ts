import { IsEmail, IsMongoId, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Auth 모듈에서 보내준 CreateUserDto + 해싱된 password를 합쳐서 저장
export class CreateUserDto {
  @ApiProperty({ description: '로그인 아이디' })
  @IsString()
  loginId: string;

  @ApiProperty({ description: '실명' })
  @IsString()
  name: string;

  @ApiProperty({ description: '소속 대학교 ID' })
  @IsMongoId()
  universityId: string;

  @ApiProperty({ description: '사용자 이메일 (전체)' })
  @IsEmail()
  universityEmail: string;

  // 계좌이체 결제 방식 때 쓰던 필드. Toss PG 연동(#20) 이후 어디서도 참조 안 됨 — 주석 처리
  // @ApiProperty({ description: "은행" })
  // @IsString()
  // bankName: string;

  // @ApiProperty({ description: "계좌" })
  // @IsNumber()
  // bankAccount: string;
}
