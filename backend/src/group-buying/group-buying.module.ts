import { Module } from '@nestjs/common';
import { GroupBuyingService } from './group-buying.service';
import { GroupBuyingController } from './group-buying.controller';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { WebPushModule } from '../web-push/web-push.module';
import { GroupBuyingQueryModule } from './query/group-buying-query.module';
import { GroupBuyingCommandModule } from './command/group-buying-command.module';
import { GroupBuyingAccessGuard } from './guard/group-buying-access.guard';

@Module({
  imports: [
    AuthModule,
    UserModule,
    WebPushModule,
    GroupBuyingQueryModule,
    GroupBuyingCommandModule,
  ],
  controllers: [GroupBuyingController],
  providers: [GroupBuyingService, GroupBuyingAccessGuard],
  exports: [
    GroupBuyingService,
    GroupBuyingQueryModule,
    GroupBuyingCommandModule,
    GroupBuyingAccessGuard,
  ],
})
export class GroupBuyingModule {}
