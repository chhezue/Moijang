import { ApiProperty } from "@nestjs/swagger";
import { IsMongoId, IsString, IsUUID, Length } from "class-validator";

// send-code 응답의 verificationId + 메일로 받은 코드로 인증
export class RequestConfirmCodeDto {
  @ApiProperty({ description: "send-code 응답으로 받은 인증 요청 ID" })
  @IsUUID("4")
  verificationId: string;

  @ApiProperty({ description: "이메일로 발송된 인증 코드" })
  @IsString()
  @Length(6, 6)
  code: string;
}
