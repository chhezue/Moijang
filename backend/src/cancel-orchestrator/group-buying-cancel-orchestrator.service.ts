import { Injectable } from '@nestjs/common';
import { GroupBuyingService } from '../group-buying/group-buying.service';
import { DeleteGroupBuyingDto } from '../group-buying/dto/delete-group-buying.dto';
import { PaymentService } from '../payment/payment.service';
import { CancelGroupBuyingResponseDto } from './dto/cancel-group-buying-response.dto';

@Injectable()
export class GroupBuyingCancelOrchestratorService {
  constructor(
    private readonly groupBuyingService: GroupBuyingService,
    private readonly paymentService: PaymentService,
  ) {}

  async cancelGroupBuying(userId: string, gbId: string, deleteDto: DeleteGroupBuyingDto) {
    // 1) 공구 상태를 먼저 취소 처리하고, 참여자 알림까지 기존 서비스 흐름을 그대로 사용합니다.
    const cancelledGroupBuying = await this.groupBuyingService.deleteGroupBuying(
      userId,
      gbId,
      deleteDto,
    );

    // 2) 취소된 공구에 연결된 결제를 순차 환불합니다. (MVP: 단순/예측 가능한 흐름 우선)
    const refundStatus = await this.paymentService.refundForGroupBuyingCancellation(
      gbId,
      `공구 취소(${deleteDto.cancelReason})`,
    );

    return {
      groupBuying: cancelledGroupBuying,
      refundStatus,
    };
  }
}
