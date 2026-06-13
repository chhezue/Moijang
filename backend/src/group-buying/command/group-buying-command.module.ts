import { Module } from '@nestjs/common';
import { GroupBuyingQueryModule } from '../query/group-buying-query.module';
import { GroupBuyingRecruitmentService } from './group-buying-recruitment.service';

@Module({
  imports: [GroupBuyingQueryModule],
  providers: [GroupBuyingRecruitmentService],
  exports: [GroupBuyingRecruitmentService],
})
export class GroupBuyingCommandModule {}
