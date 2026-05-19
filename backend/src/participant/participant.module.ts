import { Module } from '@nestjs/common';
import { ParticipantService } from './participant.service';
import { ParticipantController } from './participant.controller';
import { AuthModule } from '../auth/auth.module';
import { ParticipantQueryModule } from './query/participant-query.module';
import { GroupBuyingModule } from '../group-buying/group-buying.module';

@Module({
  imports: [AuthModule, ParticipantQueryModule, GroupBuyingModule],
  controllers: [ParticipantController],
  providers: [ParticipantService],
  exports: [ParticipantService],
})
export class ParticipantModule {}
