import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { GroupBuyingRepository } from './group-buying.repository';
import { CreateGroupBuyingDto } from './dto/create-group-buying.dto';
import { GroupBuying } from './schema/group-buying.schema';
import {
  CANCEL_REASON_LABELS,
  CancelReason,
  getEnumOptions,
  GROUP_BUYING_STATUS_LABELS,
  GroupBuyingStatus,
  PRODUCT_CATEGORY_LABELS,
  ProductCategory,
} from './const/group-buying.const';
import { UpdateGroupBuyingDto } from './dto/update-group-buying.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { DeleteGroupBuyingDto } from './dto/delete-group-buying.dto';
import { PayloadDto } from '../web-push/dto/payload.dto';
import { WebPushService } from '../web-push/web-push.service';
import { ParticipantQueryService } from '../participant/query/participant-query.service';
import { GroupBuyingQueryService } from './query/group-buying-query.service';
import { GroupBuyingRecruitmentService } from './command/group-buying-recruitment.service';

@Injectable()
export class GroupBuyingService {
  constructor(
    private readonly groupBuyingRepository: GroupBuyingRepository,
    private readonly groupBuyingQueryService: GroupBuyingQueryService,
    private readonly groupBuyingRecruitmentService: GroupBuyingRecruitmentService,
    private readonly participantQueryService: ParticipantQueryService,
    private readonly webPushService: WebPushService,
  ) {}

  // 상태 전이 검증 함수
  private isValidTransition(current: GroupBuyingStatus, next: GroupBuyingStatus): boolean {
    // key는 반드시 GroupBuyingStatus 중 하나, 각 value는 GroupBuyingStatus 배열 타입
    const allowedTransition: Record<GroupBuyingStatus, GroupBuyingStatus[]> = {
      // 모집 중 -> 모집 완료, 취소
      [GroupBuyingStatus.RECRUITING]: [GroupBuyingStatus.CONFIRMED, GroupBuyingStatus.CANCELLED],
      // 모집 완료 -> 주문 진행 중, 품절로 인한 취소
      [GroupBuyingStatus.CONFIRMED]: [GroupBuyingStatus.ORDERED, GroupBuyingStatus.CANCELLED],
      // 주문 진행 중 -> 배송 완료, 품절로 인한 취소
      [GroupBuyingStatus.ORDERED]: [GroupBuyingStatus.SHIPPED, GroupBuyingStatus.CANCELLED],
      [GroupBuyingStatus.SHIPPED]: [GroupBuyingStatus.COMPLETED],
      [GroupBuyingStatus.CANCELLED]: [],
      [GroupBuyingStatus.COMPLETED]: [],
    };

    return allowedTransition[current].includes(next); // 참여 가능 여부를 boolean으로 반환
  }

  async createGroupBuying(id: string, createDto: CreateGroupBuyingDto): Promise<GroupBuying> {
    const { fixedCount, totalPrice, shippingFee } = createDto;
    const estimatedPriceWithDecimal = (totalPrice + shippingFee) / fixedCount;
    const estimatedPrice = Math.ceil(estimatedPriceWithDecimal);

    return await this.groupBuyingRepository.create(id, createDto, estimatedPrice);
  }

  async deleteGroupBuying(
    userId: string,
    gbId: string,
    deleteDto: DeleteGroupBuyingDto,
  ): Promise<GroupBuying> {
    const gb = await this.groupBuyingQueryService.getGroupBuyingById(gbId, userId);
    if (!gb) {
      throw new NotFoundException(`공구 '${gbId}'가 존재하지 않습니다.`);
    }

    const uncancelableStatuses = [
      GroupBuyingStatus.SHIPPED,
      GroupBuyingStatus.COMPLETED,
      GroupBuyingStatus.CANCELLED,
    ];
    if (uncancelableStatuses.includes(gb.groupBuyingStatus)) {
      throw new BadRequestException('현재 상태에서는 공구를 취소할 수 없습니다.');
    }

    // 2. 취소 사유에 따른 데이터 준비 (알림 메시지, 미입금자 목록)
    // let notificationBody = '';
    // switch (deleteDto.cancelReason) {
    //   case CancelReason.LEADER_CANCELLED: // 총대 개인 사유
    //     notificationBody = `[${gb.title}] 총대님이 개인 사정으로 공구를 취소했어요. 자세한 내용은 공지사항을 확인해주세요.`;
    //     break;
    //   case CancelReason.RECRUITMENT_FAILED:
    //     notificationBody = `[${gb.title}] 모집 인원이 충족되지 않아 총대님이 공구를 취소했어요.`;
    //     break;
    //   case CancelReason.PRODUCT_UNAVAILABLE: // 상품 품절 또는 가격 변동
    //     notificationBody = `[${gb.title}] 상품 품절 또는 가격 변동으로 공구가 취소되었어요. 곧 총대님이 환불을 진행할 예정이에요.`;
    //     break;
    //   default:
    //     throw new BadRequestException('유효하지 않은 취소 사유입니다.');
    // }
    //
    // const participants: any = await this.participantQueryService.getParticipants(gbId);
    // if (participants.length > 0 && notificationBody) {
    //   const payload: PayloadDto = {
    //     title: `❌ 공구 취소`,
    //     body: notificationBody,
    //     url: `${process.env.FRONT_URL}/group-buying/detail/${gbId}`,
    //   };
    //
    //   const notificationPromises = participants.map((participant) =>
    //     this.webPushService.sendNotification(participant.userId.id, payload),
    //   );
    //   await Promise.all(notificationPromises);
    // }

    return this.groupBuyingRepository.findByGbIdAndDelete(gbId, deleteDto.cancelReason);
  }

  async updateGroupBuying(
    userId: string,
    gbId: string,
    updateDto: UpdateGroupBuyingDto,
  ): Promise<GroupBuying> {
    const gb = await this.groupBuyingQueryService.getGroupBuyingById(gbId, userId);
    if (!gb) {
      throw new NotFoundException(`공구 ${gbId}가 존재하지 않습니다.`);
    }

    let { totalPrice, shippingFee } = updateDto;

    // 가격 관련 필드(totalPrice, shippingFee)가 하나라도 들어온 경우 재계산
    if (totalPrice === undefined || shippingFee === undefined) {
      // null 또는 undefined인 경우 DB에 저장된 값 사용
      totalPrice = updateDto.totalPrice ?? gb.totalPrice;
      shippingFee = updateDto.shippingFee ?? gb.shippingFee;
    }

    const estimatedPriceWithDecimal = (totalPrice + shippingFee) / gb.fixedCount;
    const estimatedPrice = Math.ceil(estimatedPriceWithDecimal);

    if (
      gb.groupBuyingStatus !== GroupBuyingStatus.RECRUITING && // 공구 전체 수정 가능
      gb.groupBuyingStatus !== GroupBuyingStatus.CONFIRMED && // 최종 가격 수정 가능
      gb.groupBuyingStatus !== GroupBuyingStatus.SHIPPED // 픽업 장소, 시간 수정 가능
    ) {
      throw new BadRequestException(
        '공구 수정은 모집 중/모집 완료/배송 완료 상태일 때만 가능합니다.',
      );
    }

    // 총대 수량이 변경되었다면, 정원을 초과하지 않는지 체크
    if (updateDto.leaderCount !== undefined) {
      const participantTotal = await this.participantQueryService.getParticipantCount(gbId); // 일반 참여자 합 (총대 제외)
      if (participantTotal + updateDto.leaderCount > gb.fixedCount) {
        throw new BadRequestException('공구 정원을 초과했습니다. 수량을 다시 설정해주세요.');
      }
    }

    // 공구 업데이트
    const result = await this.groupBuyingRepository.findByGbIdAndUpdate(
      gbId,
      updateDto,
      estimatedPrice,
    );

    // 모집 개수를 모두 만족했고, 현재 RECRUITING 상태라면 즉시 CONFIRMED 상태로 변경
    await this.groupBuyingRecruitmentService.tryConfirmRecruitmentIfFull(gbId);

    return result;
  }

  async updateStatus(gbId: string, statusDto: UpdateStatusDto) {
    const gb = await this.groupBuyingRepository.findOneByGbId(gbId);
    if (!gb) {
      throw new NotFoundException(`공구 ${gbId}가 존재하지 않습니다.`);
    }

    const current = gb.groupBuyingStatus;
    const next = statusDto.status;

    if (current === GroupBuyingStatus.COMPLETED || current === GroupBuyingStatus.CANCELLED) {
      throw new BadRequestException('현재 상태에서는 더 이상 상태를 변경할 수 없습니다.');
    }

    // 상태 전이 제한
    if (!this.isValidTransition(current, next)) {
      throw new BadRequestException('올바르지 않은 상태 전이입니다.');
    }

    const participants: any = await this.participantQueryService.getParticipants(gbId);

    const payload: PayloadDto = {
      title: ``,
      body: ``,
      url: `${process.env.FRONT_URL}/group-buying/detail/${gbId}`,
    };

    if (participants.length) {
      // 웹 푸쉬
      for (const participant of participants) {
        const { userId } = participant;
        const { id } = userId;

        switch (statusDto.status) {
          case GroupBuyingStatus.ORDERED:
            payload.title = '📢 주문 완료';
            payload.body = `[${gb.title}] 총대가 상품 주문을 완료했어요. 배송이 시작되면 다시 알려드릴게요.`;
            break;
          case GroupBuyingStatus.SHIPPED:
            payload.title = '📢 상품 도착';
            payload.body = `[${gb.title}] 주문하신 상품이 도착했어요. 총대가 작성한 픽업 공지를 확인해주세요.`;
            break;
          case GroupBuyingStatus.CANCELLED:
            payload.title = '📢 공구 취소';
            payload.body = `[${gb.title}] 총대에 의해 공구가 취소되었어요. 자세한 내용은 공지사항을 확인해주세요.`;
            break;
        }
        if (payload.title && payload.body) {
          try {
            await this.webPushService.sendNotification(id, payload);
          } catch (error) {
            console.error(`알림 발송 실패`, error);
          }
        }
      }
    }

    return await this.groupBuyingRepository.updateStatus(gbId, statusDto.status);
  }

  // 각 enum 값에 대한 한글 텍스트 매핑 객체를 프론트엔드에 반환
  getEnums() {
    return {
      status: getEnumOptions(GroupBuyingStatus, GROUP_BUYING_STATUS_LABELS),
      category: getEnumOptions(ProductCategory, PRODUCT_CATEGORY_LABELS),
      cancelReason: getEnumOptions(CancelReason, CANCEL_REASON_LABELS),
    };
  }
}
