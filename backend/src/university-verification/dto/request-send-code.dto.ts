import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsMongoId, IsString } from "class-validator";

// 해당 dto에 기록된 정보로 웹메일 인증 코드를 보냄.
export class RequestSendCodeDto {
  @ApiProperty({ description: "이메일 인증을 진행할 대학교 ID" })
  @IsMongoId()
  universityId: string;

  @ApiProperty({ description: "사용자의 학교 이메일 전체" })
  @IsEmail()
  universityEmail: string;
}
