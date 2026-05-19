import { Injectable } from '@nestjs/common';
import { GroupBuyingStatus } from '../const/group-buying.const';
import { GroupBuyingRepository } from '../group-buying.repository';
import { GroupBuyingQueryService } from '../query/group-buying-query.service';

/**
 * 공구 모집 완료(RECRUITING → CONFIRMED) 전용 command.
 * participant 등 외부 도메인은 이 서비스만 호출하고 GroupBuyingService 전체에 의존하지 않는다.
 */
@Injectable()
export class GroupBuyingRecruitmentService {
  constructor(
    private readonly groupBuyingRepository: GroupBuyingRepository,
    private readonly groupBuyingQueryService: GroupBuyingQueryService,
  ) {}

  async tryConfirmRecruitmentIfFull(gbId: string): Promise<void> {
    const gb = await this.groupBuyingRepository.findOneByGbId(gbId);
    if (!gb || gb.groupBuyingStatus !== GroupBuyingStatus.RECRUITING) {
      return;
    }

    const effectiveCurrentCount = await this.groupBuyingQueryService.getEffectiveCurrentCount(gbId);

    if (effectiveCurrentCount >= gb.fixedCount) {
      await this.groupBuyingRepository.updateStatus(gbId, GroupBuyingStatus.CONFIRMED);
    }
  }
}
