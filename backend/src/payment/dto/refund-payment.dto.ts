import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RefundPaymentDto {
  @ApiProperty({ description: '환불 대상 결제 키' })
  @IsNotEmpty()
  @IsString()
  paymentKey: string;

  @ApiPropertyOptional({ description: '취소 사유 (토스 API에 전달)' })
  @IsOptional()
  @IsString()
  cancelReason?: string;
}
