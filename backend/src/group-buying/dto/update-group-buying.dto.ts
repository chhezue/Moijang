import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { ProductCategory } from '../const/group-buying.const';
import { Type } from 'class-transformer';

export class UpdateGroupBuyingDto {
  @ApiProperty({ description: '공구 포스트 제목' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: '제품 링크' })
  @IsUrl()
  @IsOptional()
  productUrl?: string;

  @ApiProperty({ description: '제품 및 공구 설명' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '상품의 총 금액(CONFIRMED 상태에도 수정 가능)' })
  @IsNumber()
  @IsOptional()
  totalPrice?: number;

  @ApiProperty({ description: '배송비(CONFIRMED 상태에도 수정 가능)' })
  @IsNumber()
  @IsOptional()
  shippingFee?: number;

  @ApiProperty({ description: '계좌번호' })
  @IsString()
  @IsOptional()
  account?: string;

  @ApiProperty({ description: '은행' })
  @IsString()
  @IsOptional()
  bank?: string;

  @ApiProperty({ description: '공구 마감 날짜' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endDate?: Date;

  @ApiProperty({
    description: '제품 분류 카테고리',
    enum: ProductCategory,
  })
  @IsEnum(ProductCategory)
  @IsOptional()
  category?: ProductCategory;

  @ApiProperty({ description: '총대 구매 수량' })
  @IsOptional()
  @IsNotEmpty()
  leaderCount?: number;

  @ApiProperty({ description: '픽업 장소' })
  @IsString()
  @IsOptional()
  pickupTime?: string;

  @ApiProperty({ description: '픽업 시간' })
  @IsString()
  @IsOptional()
  pickupPlace?: string;
}
