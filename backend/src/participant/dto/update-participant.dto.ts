import { IsOptional, IsNumber, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateParticipantDto {
  @ApiProperty({ description: "구매할 물건 수량" })
  @IsNumber()
  @IsOptional()
  @Min(1)
  count?: number;
}
