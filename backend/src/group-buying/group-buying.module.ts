import { Module, forwardRef } from '@nestjs/common';
import { GroupBuyingService } from './group-buying.service';
import { GroupBuyingController } from './group-buying.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { GroupBuying, GroupBuyingSchema } from './schema/group-buying.schema';
import { GroupBuyingRepository } from './group-buying.repository';
import { CommonModule } from '../common/common.module';
import { ParticipantModule } from '../participant/participant.module';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { WebPushModule } from '../web-push/web-push.module';
import { TasksModule } from './scheduler/task.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GroupBuying.name, schema: GroupBuyingSchema },
    ]),
    CommonModule,
    AuthModule,
    UserModule,
    WebPushModule,
    TasksModule,
    forwardRef(() => ParticipantModule),
  ],
  controllers: [GroupBuyingController],
  providers: [GroupBuyingService, GroupBuyingRepository],
  exports: [GroupBuyingService, GroupBuyingRepository],
})
export class GroupBuyingModule {}
