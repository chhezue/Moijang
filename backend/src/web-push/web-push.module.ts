import { Module } from '@nestjs/common';
import { WebPushController } from './web-push.controller';
import { WebPushService } from './web-push.service';
import { WebPushRepository } from './web-push.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Subscription, SubscriptionSchema } from './schema/subscription.schema';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
    ]),
    UserModule,
    AuthModule,
    ConfigModule,
  ],
  controllers: [WebPushController],
  providers: [WebPushService, WebPushRepository],
  exports: [WebPushService],
})
export class WebPushModule {}
