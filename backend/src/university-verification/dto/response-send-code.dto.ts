import { ApiProperty } from "@nestjs/swagger";
import { IsMongoId, IsString, IsUUID } from "class-validator";

export class ResponseSendCodeDto {
  @ApiProperty({ description: "생성된 인증 요청 ID" })
  @IsUUID("4")
  verificationId: string;
}
