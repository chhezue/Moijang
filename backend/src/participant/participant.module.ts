import { Module, forwardRef } from '@nestjs/common';
import { ParticipantService } from './participant.service';
import { ParticipantController } from './participant.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ParticipantRepository } from './participant.repository';
import { Participant, ParticipantSchema } from './schema/participant.schema';
import { GroupBuyingModule } from '../group-buying/group-buying.module';
import { GroupBuyingAccessGuard } from '../group-buying/guard/group-buying-access.guard';
import { CommonModule } from '../common/common.module';
import {
  GroupBuying,
  GroupBuyingSchema,
} from '../group-buying/schema/group-buying.schema';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { WebPushModule } from '../web-push/web-push.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Participant.name, schema: ParticipantSchema },
      { name: GroupBuying.name, schema: GroupBuyingSchema },
    ]),
    forwardRef(() => GroupBuyingModule),
    CommonModule,
    UserModule,
    AuthModule,
    WebPushModule,
  ],
  controllers: [ParticipantController],
  providers: [
    ParticipantService,
    ParticipantRepository,
    GroupBuyingAccessGuard,
  ],
  exports: [ParticipantService, GroupBuyingAccessGuard],
})
export class ParticipantModule {}
