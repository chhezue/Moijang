import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GroupBuying, GroupBuyingSchema } from '../schema/group-buying.schema';
import {
  Participant,
  ParticipantSchema,
} from '../../participant/schema/participant.schema';
import { TaskService } from './task.service';
import { WebPushModule } from '../../web-push/web-push.module';
import { ParticipantModule } from '../../participant/participant.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GroupBuying.name, schema: GroupBuyingSchema },
      { name: Participant.name, schema: ParticipantSchema },
    ]),
    WebPushModule,
    ParticipantModule,
  ],
  providers: [TaskService],
})
export class TasksModule {}
