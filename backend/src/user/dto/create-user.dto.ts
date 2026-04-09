import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsMongoId,
  IsString,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

// UserService에서 (CreateUserDto + Auth 모듈에서 해싱된 password) 합쳐서 저장
export class CreateUserDto {
  @ApiProperty({ description: "로그인 아이디" })
  @IsString()
  loginId: string;

  @ApiProperty({ description: "닉네임" })
  @IsString()
  displayName: string;

  @ApiProperty({ description: "학교 이메일" })
  @IsEmail()
  universityEmail: string;

  @ApiProperty({ description: "학번" })
  @IsString()
  studentNo: string;

  @ApiProperty({ description: "인증 여부" })
  @IsBoolean()
  isVerified: boolean;

  @ApiProperty({ description: "소속 대학교 ID" })
  @IsMongoId()
  universityId: string;
}
