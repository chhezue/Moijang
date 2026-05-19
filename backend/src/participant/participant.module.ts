import { Module } from '@nestjs/common';
import { ParticipantService } from './participant.service';
import { ParticipantController } from './participant.controller';
import { GroupBuyingAccessGuard } from '../group-buying/guard/group-buying-access.guard';
import { CommonModule } from '../common/common.module';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { WebPushModule } from '../web-push/web-push.module';
import { ParticipantPersistenceModule } from './persistence/participant-persistence.module';
import { ParticipantQueryModule } from './query/participant-query.module';

@Module({
  imports: [
    ParticipantPersistenceModule,
    ParticipantQueryModule,
    CommonModule,
    UserModule,
    AuthModule,
    WebPushModule,
  ],
  controllers: [ParticipantController],
  providers: [ParticipantService, GroupBuyingAccessGuard],
  exports: [ParticipantService, GroupBuyingAccessGuard],
})
export class ParticipantModule {}
