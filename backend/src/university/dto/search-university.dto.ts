import { IsOptional, IsString } from "class-validator";
import { PageOptionDto } from "../../common/dto/page-option.dto";
import { ApiProperty } from "@nestjs/swagger";

export class SearchUniversityDto extends PageOptionDto {
  @ApiProperty({ description: "대학교 이름" })
  @IsString()
  @IsOptional()
  keyword?: string;
}
