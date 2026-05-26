import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefundPaymentDto {
  @ApiProperty({ description: '취소 사유 (토스 API에 전달)' })
  @IsNotEmpty()
  @IsString()
  cancelReason: string;
}
