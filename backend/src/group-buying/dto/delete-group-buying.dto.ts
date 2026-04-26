import { IsEnum, IsNotEmpty } from "class-validator";
import { CancelReason } from "../const/group-buying.const";
import { ApiProperty } from "@nestjs/swagger";

export class DeleteGroupBuyingDto {
  @ApiProperty({
    description: "취소 사유",
    enum: CancelReason,
  })
  @IsEnum(CancelReason)
  @IsNotEmpty()
  cancelReason: CancelReason;
}
