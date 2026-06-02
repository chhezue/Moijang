import { ApiProperty } from '@nestjs/swagger';
import { GroupBuying } from '../../group-buying/schema/group-buying.schema';
import { RefundStatus } from '../../payment/const/payment.const';

export class CancelGroupBuyingResponseDto {
  @ApiProperty({ description: '취소된 공구' })
  groupBuying: GroupBuying;

  @ApiProperty({ enum: RefundStatus, description: '환불 상태' })
  refundStatus: RefundStatus;
}
