import { IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PageOptionDto {
  @ApiProperty({
    description: '페이지 번호',
    default: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    description: '페이지당 항목 수',
    default: 10,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  limit?: number = 10;
}
