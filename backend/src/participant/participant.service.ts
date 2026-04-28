import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ParticipantRepository } from "./participant.repository";
import { CreateParticipantDto } from "./dto/create-participant.dto";
import { Participant } from "./schema/participant.schema";
import { GroupBuyingStatus } from "../group-buying/const/group-buying.const";

import { UpdateParticipantDto } from "./dto/update-participant.dto";
import { GroupBuyingRepository } from "../group-buying/group-buying.repository";
import { WebPushService } from "../web-push/web-push.service";
import { PayloadDto } from "../web-push/dto/payload.dto";
import { UserService } from "../user/user.service";

@Injectable()
export class ParticipantService {
  constructor(
    private readonly participantRepository: ParticipantRepository,
    private readonly groupBuyingRepository: GroupBuyingRepository,
    private readonly webPushService: WebPushService,
    private readonly userService: UserService,
  ) {}

  async isParticipant(userId: string, gbId: string): Promise<boolean> {
    const participant = await this.participantRepository.findOne({
      userId,
      gbId,
    });

    return !!participant;
  }

  async getParticipants(gbId: string): Promise<Participant[]> {
    return await this.participantRepository.findAll({ gbId });
  }

  async getParticipantById(gbId: string, userId: string): Promise<Participant> {
    return await this.participantRepository.findOne({
      gbId,
      userId,
    });
  }

  async createLeader(gbId: string, count: number, leaderId: string) {
    await this.participantRepository.create({
      gbId,
      count,
      isPaid: true,
      userId: leaderId,
    });
  }

  async updateLeader(gbId: string, count: number, leaderId: string) {
    await this.participantRepository.findOneAndUpdate(
      { gbId, userId: leaderId },
      { count: count },
      { new: true },
    );
  }

  async joinGroupBuying(
    createDto: CreateParticipantDto,
    userId: string,
  ): Promise<Participant> {
    const exists = await this.participantRepository.findOne({
      userId,
      gbId: createDto.gbId,
    });
    // 이미 참여한 공구인지 중복 체크
    if (exists) {
      throw new BadRequestException("이미 참여한 공구입니다.");
    }

    const beforeTotalCount = await this.participantRepository.getTotalCount(
      createDto.gbId,
    );

    const groupBuying = await this.groupBuyingRepository.getCurrentCount(
      createDto.gbId,
      createDto.count,
      beforeTotalCount,
    );

    // 3. 성공한 경우에만 참여자 정보를 생성합니다.
    const newParticipant = await this.participantRepository.create({
      userId,
      ...createDto,
    });

    const totalCount = await this.participantRepository.getTotalCount(
      createDto.gbId,
    );

    // 모집 개수가 다 찼고 아직 모집 중 상태라면 즉시 확정으로 변경
    if (
      totalCount >= groupBuying.fixedCount &&
      groupBuying.groupBuyingStatus === GroupBuyingStatus.RECRUITING
    ) {
      await this.groupBuyingRepository.updateStatus(
        createDto.gbId,
        GroupBuyingStatus.CONFIRMED,
      );

      const payload: PayloadDto = {
        title: "📢 모집 완료 알림",
        body: `[${groupBuying.title}] 모집이 완료되었어요. 최종 가격을 확정하고 입금 요청을 진행해주세요.`,
        url: `${process.env.FRONT_URL}/group-buying/detail/${createDto.gbId}`,
      };
      await this.webPushService.sendNotification(groupBuying.leaderId, payload);
    }

    return newParticipant;
  }

  async updateParticipant(
    gbId: string,
    userId: string,
    updateDto: UpdateParticipantDto,
  ): Promise<Participant> {
    // 해당 공구가 RECRUITING 상태인지 확인
    const gb = await this.groupBuyingRepository.findOneByGbId(gbId);
    if (gb.groupBuyingStatus !== GroupBuyingStatus.RECRUITING) {
      throw new BadRequestException(
        "참여자 정보 수정은 모집 중 상태일 때만 가능합니다.",
      );
    }

    const participant = await this.participantRepository.findOne({
      gbId,
      userId,
    });
    if (!participant) throw new NotFoundException("참여 내역이 없습니다.");

    // 수량 변화량 계산
    const quantityChange = updateDto.count - participant.count;

    const beforeTotalCount =
      await this.participantRepository.getTotalCount(gbId);

    const groupBuying = await this.groupBuyingRepository.getCurrentCount(
      gbId,
      quantityChange,
      beforeTotalCount,
    );

    const updatedParticipant =
      await this.participantRepository.findOneAndUpdate(
        { gbId, userId },
        updateDto,
        { new: true },
      );

    const totalCount = await this.participantRepository.getTotalCount(gbId);
    // 모집 개수가 다 찼고 아직 모집 중 상태라면 즉시 확정으로 변경
    if (
      totalCount >= groupBuying.fixedCount &&
      groupBuying.groupBuyingStatus === GroupBuyingStatus.RECRUITING
    ) {
      await this.groupBuyingRepository.updateStatus(
        gbId,
        GroupBuyingStatus.CONFIRMED,
      );
      const payload: PayloadDto = {
        title: "📢 모집 완료 알림",
        body: "모집이 완료되었어요. 최종 가격을 확정하고 입금 요청을 진행해주세요.",
        url: `${process.env.FRONT_URL}/group-buying/detail/${gbId}`,
      };
      await this.webPushService.sendNotification(groupBuying.leaderId, payload);
    }

    return updatedParticipant;
  }

  async withdrawGroupBuying(gbId: string, userId: string) {
    // 1. 참여자 정보를 먼저 삭제합니다.
    const deletedParticipant =
      await this.participantRepository.findOneAndDelete({
        gbId,
        userId,
      });

    if (!deletedParticipant) {
      throw new NotFoundException("참여 내역이 없습니다.");
    }

    return true;
  }

  async confirmPayment(gbId: string, userId: string): Promise<Participant> {
    // 해당 사용자가 공구에 참여하고 있는지 확인
    const participant = await this.participantRepository.findOne({
      gbId,
      userId,
    });
    if (!participant) {
      throw new BadRequestException("일치하는 참여 내역을 찾을 수 없습니다.");
    }

    // 해당 공구가 PAYMENT_IN_PROGRESS 상태인지 확인
    const groupBuying: any =
      await this.groupBuyingRepository.findOneByGbId(gbId);
    if (
      groupBuying.groupBuyingStatus !== GroupBuyingStatus.PAYMENT_IN_PROGRESS
    ) {
      throw new BadRequestException(
        "참여자 입금 확정은 입금 진행 중 상태일 때만 가능합니다.",
      );
    }

    const { name } = await this.userService.getUserById(userId);

    const payload: PayloadDto = {
      title: "📢 입금 완료 알림",
      body: `[${name}]님이 입금을 완료했어요. 확인 후 처리해주세요.`,
      url: `${process.env.FRONT_URL}/group-buying/detail/${gbId}`,
    };
    await this.webPushService.sendNotification(groupBuying.leaderId, payload);

    const result = await this.participantRepository.findOneAndUpdate(
      { gbId, userId },
      { isPaid: true },
      { new: true },
    );

    const allConfirmPayment =
      await this.participantRepository.checkAllUserPayment(gbId);

    if (allConfirmPayment) {
      await this.groupBuyingRepository.updateStatus(
        gbId,
        GroupBuyingStatus.ORDER_PENDING,
      );

      const payload: PayloadDto = {
        title: "📢 전체 입금 완료 알림",
        body: `모든 참여자의 입금이 확인되었어요. 상품을 주문해주세요.`,
        url: `${process.env.FRONT_URL}/group-buying/detail/${gbId}`,
      };
      const _id = groupBuying.leaderId.id as string;
      await this.webPushService.sendNotification(_id, payload);
    }
    return result;
  }

  //내가 참여한 공구의 _id 조회
  async getParticipatedGroupBuyingIds(userId: string) {
    const participatedRecords = await this.participantRepository.find({
      userId,
    });
    return participatedRecords.map((p) => p.gbId);
  }

  async getTotalCount(gbId: string) {
    return this.participantRepository.getTotalCount(gbId);
  }
}
