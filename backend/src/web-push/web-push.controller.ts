import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { WebPushService } from './web-push.service';
import { CreateSubscriptionDto, SubscriptionDto } from './dto/subscription.dto';
import { ConfigService } from '@nestjs/config';
import { PayloadDto } from './dto/payload.dto';
import { UserDecorator } from '../user/decorator/user.decorator';
import { JwtAuthGuard } from '../auth/guard/auth.guard';
import { Subscription } from './schema/subscription.schema';

@Controller('web-push')
export class WebPushController {
  constructor(
    private readonly webPushService: WebPushService,
    private readonly configService: ConfigService,
  ) {}

  // 구독 정보 저장 (클라이언트에서 등록)
  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  async subscribe(
    @UserDecorator('id') userId: string,
    @Body() sub: SubscriptionDto,
  ): Promise<Subscription> {
    return await this.webPushService.createSubscription(userId, sub);
  }

  // 저장된 모든 구독자에게 알림 전송
  @Post('send-all')
  @UseGuards(JwtAuthGuard)
  async sendNotificationToAll(
    @UserDecorator('displayName') senderName: string,
    @Body() payload: PayloadDto,
  ): Promise<any> {
    return await this.webPushService.sendNotificationToAll(senderName, payload);
  }

  // 단일 사용자에게 테스트 알림 발송
  @Post('send/:receiveId')
  @UseGuards(JwtAuthGuard)
  async sendNotification(
    @UserDecorator('displayName') senderName: string,
    @Param('receiveId') receiverId: string,
    @Body() payload: PayloadDto,
  ): Promise<any> {
    return await this.webPushService.sendNotification(
      receiverId,
      payload,
      senderName,
    );
  }

  // VAPID 공개 키를 클라이언트에게 제공
  @Get('public-key')
  getPublicKey(): string {
    const publicKey = this.configService.get('VAPID_PUBLIC_KEY');

    if (!publicKey) {
      throw new Error(`VAPID 공개 키가 존재하지 않습니다: ${publicKey}`);
    } else {
      return publicKey;
    }
  }
}
