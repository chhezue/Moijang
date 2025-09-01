import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUrl,
} from 'class-validator';
import { ProductCategory } from '../const/group-buying.const';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateGroupBuyingDto {
  @ApiProperty({ description: '공구 포스트 제목' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: '제품 링크' })
  @IsUrl()
  @IsNotEmpty()
  productUrl: string;

  @ApiProperty({ description: '제품 및 공구 설명' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: '구매할 총 수량' })
  @IsNumber()
  @IsNotEmpty()
  fixedCount: number;

  @ApiProperty({ description: '상품의 총 금액' })
  @IsNumber()
  totalPrice: number;

  @ApiProperty({ description: '배송비' })
  @IsNumber()
  @IsNotEmpty()
  shippingFee: number;

  @ApiProperty({ description: '계좌번호' })
  @IsString()
  @IsNotEmpty()
  account: string;

  @ApiProperty({ description: '은행' })
  @IsString()
  @IsNotEmpty()
  bank: string;

  @ApiProperty({ description: '공구 마감 날짜' })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  endDate: Date;

  @ApiProperty({
    description: '제품 분류 카테고리',
    enum: ProductCategory,
  })
  @IsEnum(ProductCategory)
  @IsNotEmpty()
  category: ProductCategory;

  @ApiProperty({ description: '총대 구매 수량' })
  @IsNumber()
  @IsNotEmpty()
  leaderCount: number;
}
