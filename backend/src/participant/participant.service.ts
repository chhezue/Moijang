import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ParticipantRepository } from "./participant.repository";
import { CreateParticipantDto } from "./dto/create-participant.dto";
import { Participant } from "./schema/participant.schema";
import { GroupBuyingStatus } from "../group-buying/const/group-buying.const";
import { GroupBuyingRepository } from "../group-buying/group-buying.repository";
import { Types } from "mongoose";

@Injectable()
export class ParticipantService {
  constructor(
    private readonly participantRepository: ParticipantRepository,
    private readonly groupBuyingRepository: GroupBuyingRepository,
  ) {}

  async isParticipant(userId: string, gbId: string): Promise<boolean> {
    const userObjectId = new Types.ObjectId(userId);
    const gbObjectId = new Types.ObjectId(gbId);
    const participant = await this.participantRepository.findOne({
      userId: userObjectId,
      gbId: gbObjectId,
    });

    return !!participant;
  }

  async getParticipants(gbId: string): Promise<Participant[]> {
    return await this.participantRepository.findAll({
      gbId: new Types.ObjectId(gbId),
    });
  }

  async getParticipantById(gbId: string, userId: string): Promise<Participant> {
    const userObjectId = new Types.ObjectId(userId);
    const gbObjectId = new Types.ObjectId(gbId);
    return await this.participantRepository.findOne({
      gbId: gbObjectId,
      userId: userObjectId,
    });
  }

  async createLeader(gbId: string, count: number, leaderId: string) {
    await this.participantRepository.create({
      gbId: new Types.ObjectId(gbId),
      count,
      isPaid: true,
      userId: new Types.ObjectId(leaderId),
    });
  }

  async updateLeader(gbId: string, count: number, leaderId: string) {
    const gbObjectId = new Types.ObjectId(gbId);
    const leaderObjectId = new Types.ObjectId(leaderId);
    await this.participantRepository.findOneAndUpdate(
      { gbId: gbObjectId, userId: leaderObjectId },
      { count: count },
      { new: true },
    );
  }

  async joinGroupBuying(
    createDto: CreateParticipantDto,
    userId: string,
  ): Promise<Participant> {
    const userObjectId = new Types.ObjectId(userId);
    const gbObjectId = new Types.ObjectId(createDto.gbId);
    const exists = await this.participantRepository.findOne({
      userId: userObjectId,
      gbId: gbObjectId,
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
      ...createDto,
      userId: userObjectId,
      gbId: gbObjectId,
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

      // const payload: PayloadDto = {
      //   title: "📢 모집 완료 알림",
      //   body: `[${groupBuying.title}] 모집이 완료되었어요. 최종 가격을 확정하고 입금 요청을 진행해주세요.`,
      //   url: `${process.env.FRONT_URL}/group-buying/detail/${createDto.gbId}`,
      // };
      // await this.webPushService.sendNotification(groupBuying.leaderId, payload);
    }

    return newParticipant;
  }

  // TODO 모집 중일 때만 취소 가능
  async withdrawGroupBuying(gbId: string, userId: string) {
    const gbObjectId = new Types.ObjectId(gbId);
    const userObjectId = new Types.ObjectId(userId);
    // 1. 참여자 정보를 먼저 삭제합니다.
    const deletedParticipant =
      await this.participantRepository.findOneAndDelete({
        gbId: gbObjectId,
        userId: userObjectId,
      });

    if (!deletedParticipant) {
      throw new NotFoundException("참여 내역이 없습니다.");
    }

    return true;
  }

  // 내가 참여한 공구의 id 목록 조회
  async getParticipatedGroupBuyingIds(userId: string) {
    const participatedRecords = await this.participantRepository.find({
      userId: new Types.ObjectId(userId),
    });
    return participatedRecords.map((p) => p.gbId);
  }

  async getTotalCount(gbId: string) {
    return this.participantRepository.getTotalCount(gbId);
  }
}
