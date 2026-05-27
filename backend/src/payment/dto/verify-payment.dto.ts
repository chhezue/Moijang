import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

// 카드 인증(가인증)까지 마친 후, 해당 dto로 최종 결제
// paymentKey(토스 발급), orderId(서버 발급) 모두 확인 후 최종 결제
export class VerifyPaymentDto {
  @ApiProperty({ description: '토스 결제 키' })
  @IsNotEmpty()
  @IsString()
  paymentKey: string;

  @ApiProperty({ description: '주문 번호' })
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @ApiProperty({ description: '승인 요청 금액' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;
}
