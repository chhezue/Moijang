import { ApiProperty } from '@nestjs/swagger';

export class CheckoutResponseDto {
  @ApiProperty({ description: '서버 발급 주문 번호 (토스 orderId)' })
  orderId: string;

  @ApiProperty({ description: '결제 금액' })
  amount: number;

  @ApiProperty({ description: '토스 결제창 SDK용 클라이언트 키' })
  clientKey: string;

  @ApiProperty({ description: '주문명 (토스 결제창에 표시)' })
  orderName: string;

  @ApiProperty({ description: '공동구매 ID' })
  gbId: string;

  @ApiProperty({ description: '구매 수량' })
  count: number;
}
