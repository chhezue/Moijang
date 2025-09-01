import { Injectable } from '@nestjs/common';
import { SubscriptionDto } from './dto/subscription.dto';
import { WebPushRepository } from './web-push.repository';
import * as webpush from 'web-push';
import { ConfigService } from '@nestjs/config';
import { Subscription } from './schema/subscription.schema';
import { PayloadDto } from './dto/payload.dto';

@Injectable()
export class WebPushService {
  constructor(
    private readonly webPushRepository: WebPushRepository,
    private readonly configService: ConfigService,
  ) {
    const publicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');

    if (!publicKey || !privateKey) {
      throw new Error('VAPID 키가 설정되어 있지 않습니다.');
    }

    webpush.setVapidDetails('mailto:ybcho@pmirnc.com', publicKey, privateKey);
  }

  async createSubscription(
    userId: string,
    sub: SubscriptionDto,
  ): Promise<Subscription> {
    return await this.webPushRepository.upsert(userId, sub);
  }

  async sendNotification(
    receiverId: string,
    payload: PayloadDto,
    senderName?: string,
  ) {
    try {
      // 수신자의 구독 정보 확인
      const sub = await this.webPushRepository.findOne({ userId: receiverId });

      // 클라이언트에서 알림 클릭 시 이동할 URL을 payload 데이터에 포함시켜 전달
      const webPushPayload = {
        ...payload,
        senderName, // 보낸 사람 이름도 함께 전달
        url: payload.url,
      };

      if (sub) {
        const { endpoint, keys, expirationTime } = sub;
        await webpush.sendNotification(
          { endpoint, keys, expirationTime },
          JSON.stringify(webPushPayload), // payload 전달
        );

        return {
          message: '알림 발송 완료',
          webPushPayload,
        };
      }
    } catch (e) {
      console.error('알림 발송 실패:', e);
      throw new Error(`알림 발송 중 오류 발생: ${e.message}`);
    }
  }

  async sendNotificationToAll(senderName: string, payload: PayloadDto) {
    const allSubs = await this.webPushRepository.findAll();
    const failedEndpoints: string[] = [];
    const promises = [];

    const notificationPayload = {
      ...payload,
      senderName,
      url: `${this.configService.get<string>('FRONT_URL')}/${payload.url}`,
    };

    for (const sub of allSubs) {
      const promise = webpush
        .sendNotification(sub, JSON.stringify(notificationPayload))
        .catch((err) => {
          console.error(`${sub.endpoint}에 알림 발송 실패: ${err.message}`);
          failedEndpoints.push(sub.endpoint);
        });
      promises.push(promise);
    }

    await Promise.all(promises);

    return {
      message: '전체 알림 발송 시도 완료',
      successCount: allSubs.length - failedEndpoints.length,
      failedCount: failedEndpoints.length,
    };
  }
}
