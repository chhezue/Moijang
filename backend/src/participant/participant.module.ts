import { Module } from '@nestjs/common';
import { ParticipantService } from './participant.service';
import { ParticipantController } from './participant.controller';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { ParticipantQueryModule } from './query/participant-query.module';
import { GroupBuyingQueryModule } from '../group-buying/query/group-buying-query.module';
import { GroupBuyingCommandModule } from '../group-buying/command/group-buying-command.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    ParticipantQueryModule,
    GroupBuyingQueryModule,
    GroupBuyingCommandModule,
  ],
  controllers: [ParticipantController],
  providers: [ParticipantService],
  exports: [ParticipantService],
})
export class ParticipantModule {}
