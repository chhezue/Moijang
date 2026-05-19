import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ParticipantRepository } from './persistence/participant.repository';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { Participant } from './schema/participant.schema';
import { GroupBuyingStatus } from '../group-buying/const/group-buying.const';
import { Types } from 'mongoose';
import { GroupBuyingQueryService } from '../group-buying/query/group-buying-query.service';

@Injectable()
export class ParticipantService {
  constructor(
    private readonly groupBuyingQueryService: GroupBuyingQueryService,
    private readonly participantRepository: ParticipantRepository,
  ) {}

  async joinGroupBuying(createDto: CreateParticipantDto, userId: string): Promise<Participant> {
    const userObjectId = new Types.ObjectId(userId);
    const gbObjectId = new Types.ObjectId(createDto.gbId);

    const isLeader = await this.groupBuyingQueryService.isLeader(userId, createDto.gbId);
    if (isLeader) {
      throw new BadRequestException('자신이 주최한 공구에는 참여할 수 없습니다.');
    }

    // 1) 이미 참여한 공구인지 중복 체크
    const exists = await this.participantRepository.findOne({
      userId: userObjectId,
      gbId: gbObjectId,
    });
    if (exists) {
      throw new BadRequestException('이미 참여한 공구입니다.');
    }

    // 2) 참여 전, 정원을 초과하지 않는지 체크
    const currentCount = await this.groupBuyingQueryService.getEffectiveCurrentCount(
      createDto.gbId,
    ); // 총대 포함 현재 수량
    const gb = await this.groupBuyingQueryService.getGroupBuyingById(createDto.gbId);
    if (currentCount + createDto.count > gb.fixedCount) {
      throw new BadRequestException('공구 정원을 초과했습니다. 수량을 다시 설정해주세요.');
    }

    // 3) 참여 가능한 경우
    const newParticipant = await this.participantRepository.create({
      ...createDto,
      userId: userObjectId,
      gbId: gbObjectId,
    });

    // 4) 모집 개수를 모두 만족했고, 현재 RECRUITING 상태라면 즉시 CONFIRMED 상태로 변경
    const newCurrentCount = await this.groupBuyingQueryService.getEffectiveCurrentCount(
      createDto.gbId,
    ); // 총대 포함 현재 수량
    if (newCurrentCount >= gb.fixedCount && gb.groupBuyingStatus === GroupBuyingStatus.RECRUITING) {
      // TODO 리포지토리 참조 문제 해결
      // await this.groupBuyingRepository.updateStatus(createDto.gbId, GroupBuyingStatus.CONFIRMED);
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
    const deletedParticipant = await this.participantRepository.findOneAndDelete({
      gbId: gbObjectId,
      userId: userObjectId,
    });

    if (!deletedParticipant) {
      throw new NotFoundException('참여 내역이 없습니다.');
    }

    return true;
  }
}
