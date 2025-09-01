import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GroupBuyingModule } from './group-buying/group-buying.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ParticipantModule } from './participant/participant.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { CommonModule } from './common/common.module';
import { ScheduleModule } from '@nestjs/schedule';
import { WebPushModule } from './web-push/web-push.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.development',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    GroupBuyingModule,
    ParticipantModule,
    UserModule,
    AuthModule,
    CommonModule,
    WebPushModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
