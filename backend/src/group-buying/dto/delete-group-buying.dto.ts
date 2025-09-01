import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { CancelReason } from '../const/group-buying.const';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteGroupBuyingDto {
  @ApiProperty({
    description: '취소 사유',
    enum: CancelReason,
  })
  @IsEnum(CancelReason)
  @IsNotEmpty()
  cancelReason: CancelReason;

  @ApiProperty({ description: '미입금 참여자들의 User ID 배열' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  nonDepositors?: string[];
}
