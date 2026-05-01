import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SearchUniversityDto {
  @ApiProperty({ description: '검색할 대학교 이름', required: false })
  @IsString()
  @IsOptional()
  keyword: string;
}
