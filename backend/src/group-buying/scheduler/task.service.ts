import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { GroupBuying } from '../schema/group-buying.schema';
import { CancelReason, GroupBuyingStatus } from '../const/group-buying.const';
import { PayloadDto } from '../../web-push/dto/payload.dto';
import { WebPushService } from '../../web-push/web-push.service';
import { Participant } from '../../participant/schema/participant.schema';
import { ParticipantService } from '../../participant/participant.service';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    @InjectModel(GroupBuying.name)
    private groupBuyingModel: Model<GroupBuying>,
    @InjectModel(Participant.name)
    private participantModel: Model<Participant>,
    private readonly webPushService: WebPushService,
    private readonly participantService: ParticipantService,
  ) {}

  /**
   * [10분마다 실행되는 통합 상태 감시 스케줄러]
   * - 업무 시간(평일 9시-19시)에만 동작합니다.
   * - '모집 중' 또는 '입금 진행 중'인 모든 공구를 감시하여 상태를 업데이트합니다.
   */
  @Cron('*/10 * * * *') // 10분마다 실행
  async handleGroupBuyingStatusCheck() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();

    const isWorkingHours = currentHour >= 9 && currentHour < 19; // 업무 시간 09-19시 설정
    const isWeekday = currentDay > 0 && currentDay < 6; // 월요일(1) ~ 금요일(5)

    if (!isWorkingHours || !isWeekday) {
      return; // 업무 시간이 아니면 순찰 종료
    }

    this.logger.log('\x1b[36m🔍 공동구매 상태 감시 스케줄러 실행\x1b[0m');

    const groupBuys = await this.groupBuyingModel.find({
      groupBuyingStatus: {
        $in: [GroupBuyingStatus.RECRUITING, GroupBuyingStatus.PAYMENT_IN_PROGRESS],
      },
    });

    if (groupBuys.length === 0) {
      return;
    }

    await Promise.all(
      groupBuys.map(async (gb) => {
        if (gb.groupBuyingStatus === GroupBuyingStatus.RECRUITING) {
          await this.cancelExpiredGroupBuying(gb, now);
        } else if (gb.groupBuyingStatus === GroupBuyingStatus.PAYMENT_IN_PROGRESS) {
          const isCancelled = await this.cancelUnpaidGroupBuying(gb, now);
          if (!isCancelled) {
            await this.sendDepositReminder(gb, now);
          }
        }
        /*if (gb.groupBuyingStatus === GroupBuyingStatus.SHIPPED) {
          await this.runShippingCompletionJob(gb);
        }*/
      }),
    );
  }

  @Cron('0 0 0 * * *')
  private async handleShippingCompletion() {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // 'SHIPPED' 상태이면서, updatedAt이 3일 전보다 오래된 모든 문서를 찾아
    // 'COMPLETED'로 한번에 업데이트
    await this.groupBuyingModel.updateMany(
      {
        groupBuyingStatus: GroupBuyingStatus.SHIPPED,
        updatedAt: { $lte: threeDaysAgo },
      },
      {
        $set: { groupBuyingStatus: GroupBuyingStatus.COMPLETED },
      },
    );
  }

  /**
   * [역할 1] 모집 마감 & 목표 미달성 공구를 찾아 취소합니다.
   */
  private async cancelExpiredGroupBuying(gb: GroupBuying, now: Date): Promise<void> {
    const totalCount = await this.participantService.getTotalCount(gb._id.toString());
    if (gb.endDate < now && totalCount < gb.fixedCount) {
      await this.groupBuyingModel.updateOne(
        { _id: gb._id },
        {
          $set: {
            groupBuyingStatus: GroupBuyingStatus.CANCELLED,
            cancelReason: CancelReason.SYSTEM_CANCELLED,
          },
        },
      );
      this.logger.log(
        `\x1b[31m❌ [${gb.title}] 공구가 목표 미달성으로 취소 처리되었습니다.\x1b[0m`,
      );

      const participants = await this.participantModel.find({ gbId: gb._id }).lean();
      const notificationPromises = participants.map((p) => {
        const payload: PayloadDto = {
          title: '📢 공구 자동 취소 알림',
          body: `[${gb.title}] 모집이 마감되었지만 목표 수량을 채우지 못해 공구가 취소되었어요.`,
          url: `${process.env.FRONT_URL}/group-buying/detail/${gb._id}`,
        };
        return this.webPushService.sendNotification(p.userId.toString(), payload);
      });
      await Promise.all(notificationPromises);
    }
  }

  /**
   * [역할 2] 미입금자가 발생한 공구를 찾아 취소합니다. (입금 기한: 24시간)
   */
  private async cancelUnpaidGroupBuying(gb: GroupBuying, now: Date): Promise<boolean> {
    const DEPOSIT_TIME_LIMIT_MS = 24 * 60 * 60 * 1000; // 24시간
    const deadline = new Date(gb.updatedAt.getTime() + DEPOSIT_TIME_LIMIT_MS);

    if (deadline < now) {
      const unpaidCount = await this.participantModel.countDocuments({
        gbId: gb._id,
        isPaid: false,
      });
      if (unpaidCount > 0) {
        await this.groupBuyingModel.updateOne(
          { _id: gb._id },
          {
            $set: {
              groupBuyingStatus: GroupBuyingStatus.CANCELLED,
              cancelReason: CancelReason.PAYMENT_FAILED,
            },
          },
        );
        this.logger.log(
          `\x1b[33m⚠️  [${gb.title}] 공구가 미입금으로 인해 취소 처리되었습니다.\x1b[0m`,
        );

        const participants = await this.participantModel.find({ gbId: gb._id }).lean();
        const notificationPromises = participants.map((p) => {
          const payload: PayloadDto = {
            title: '📢 공구 자동 취소 알림',
            body: `[${gb.title}] 미입금자가 발생하여 공구가 자동으로 취소되었어요. 곧 총대님이 환불을 진행할 예정이에요.`,
            url: `${process.env.FRONT_URL}/group-buying/detail/${gb._id}`,
          };
          return this.webPushService.sendNotification(p.userId.toString(), payload);
        });
        await Promise.all(notificationPromises);
        return true;
      }
    }
    return false;
  }

  /**
   * [역할 3] 입금 마감이 임박한 공구의 미입금자에게 알림을 보냅니다. (마감 6시간 전)
   */
  private async sendDepositReminder(gb: GroupBuying, now: Date): Promise<void> {
    const DEPOSIT_TIME_LIMIT_MS = 24 * 60 * 60 * 1000; // 24시간
    const REMINDER_THRESHOLD_HOURS = 6; // 📢 마감 6시간 전부터 알림

    const deadline = new Date(gb.updatedAt.getTime() + DEPOSIT_TIME_LIMIT_MS);
    const hoursLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursLeft > 0 && hoursLeft <= REMINDER_THRESHOLD_HOURS && !gb.isReminderSent) {
      const unpaidParticipants = await this.participantModel
        .find({ gbId: gb._id, isPaid: false })
        .lean();

      if (unpaidParticipants.length > 0) {
        const notificationPromises = unpaidParticipants.map((p) => {
          const payload: PayloadDto = {
            title: '📢 입금 마감 임박 알림',
            body: `[${gb.title}] 공구 입금 마감이 약 ${Math.ceil(
              hoursLeft,
            )}시간 남았어요. 서둘러주세요!`,
            url: `${process.env.FRONT_URL}/group-buying/detail/${gb._id}`,
          };
          return this.webPushService.sendNotification(p.userId.toString(), payload);
        });

        await Promise.all(notificationPromises);
        this.logger.log(
          `[🚀] [${gb.title}] 공구 입금 마감 임박 알림 발송 완료 (${unpaidParticipants.length}명)`,
        );
      }

      await this.groupBuyingModel.updateOne({ _id: gb._id }, { $set: { isReminderSent: true } });
    }
  }
}
