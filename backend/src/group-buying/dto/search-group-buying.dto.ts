import { IsOptional, IsString } from 'class-validator';
import { PageOptionDto } from '../../common/dto/page-option.dto';
import { ApiProperty } from '@nestjs/swagger';
import {
  GroupBuyingStatus,
  ProductCategory,
} from '../const/group-buying.const';

export class SearchGroupBuyingDto extends PageOptionDto {
  // page, limit, orderBy
  @ApiProperty({ description: '검색할 키워드' })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiProperty({ description: '검색할 카테고리' })
  @IsString()
  @IsOptional()
  category?: ProductCategory;

  @ApiProperty({ description: '검색할 상태' })
  @IsString()
  @IsOptional()
  status?: GroupBuyingStatus;
}
