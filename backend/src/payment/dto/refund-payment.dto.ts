import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class RefundPaymentDto {
  @ApiProperty({ description: '참여 취소할 공동구매 ID' })
  @IsNotEmpty()
  @IsMongoId()
  gbId: string;

  @ApiProperty({ description: '취소 사유 (토스 API에 전달)' })
  @IsNotEmpty()
  @IsString()
  cancelReason: string;
}
