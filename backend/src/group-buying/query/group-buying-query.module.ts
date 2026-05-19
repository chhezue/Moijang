import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GroupBuying, GroupBuyingSchema } from '../schema/group-buying.schema';
import { GroupBuyingRepository } from '../group-buying.repository';
import { CommonModule } from '../../common/common.module';
import { ParticipantQueryModule } from '../../participant/query/participant-query.module';
import { GroupBuyingQueryService } from './group-buying-query.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: GroupBuying.name, schema: GroupBuyingSchema }]),
    CommonModule,
    ParticipantQueryModule,
  ],
  providers: [GroupBuyingQueryService, GroupBuyingRepository],
  exports: [GroupBuyingQueryService, GroupBuyingRepository, ParticipantQueryModule],
})
export class GroupBuyingQueryModule {}
