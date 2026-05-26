import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ParticipantRepository } from './persistence/participant.repository';
import { Participant } from './schema/participant.schema';
import { Types } from 'mongoose';
import { GroupBuyingQueryService } from '../group-buying/query/group-buying-query.service';
import { GroupBuyingRecruitmentService } from '../group-buying/command/group-buying-recruitment.service';

@Injectable()
export class ParticipantService {
  constructor(
    private readonly groupBuyingQueryService: GroupBuyingQueryService,
    private readonly groupBuyingRecruitmentService: GroupBuyingRecruitmentService,
    private readonly participantRepository: ParticipantRepository,
  ) {}

  // 결제 이후 호출되는 내부 메소드
  async joinGroupBuyingAfterPayment(
    gbId: string,
    userId: string,
    count: number,
  ): Promise<Participant> {
    const userObjectId = new Types.ObjectId(userId);
    const gbObjectId = new Types.ObjectId(gbId);

    const isLeader = await this.groupBuyingQueryService.isLeader(userId, gbId);
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

    // 2) 참여 전, 정원을 초과하지 않는지 체크 (confirm 시점 최종 검증)
    const currentCount = await this.groupBuyingQueryService.getEffectiveCurrentCount(gbId);
    const gb = await this.groupBuyingQueryService.getGroupBuyingById(gbId);
    if (currentCount + count > gb.fixedCount) {
      throw new BadRequestException('공구 정원을 초과했습니다. 수량을 다시 설정해주세요.');
    }

    // 3) 참여 가능한 경우
    const newParticipant = await this.participantRepository.create({
      userId: userObjectId,
      gbId: gbObjectId,
      count: count,
    });

    // 4) 모집 개수를 모두 만족했고, 현재 RECRUITING 상태라면 즉시 CONFIRMED 상태로 변경
    await this.groupBuyingRecruitmentService.tryConfirmRecruitmentIfFull(gbId);

    return newParticipant;
  }

  // 환불 이후 호출되는 내부 메소드
  async withdrawGroupBuyingAfterRefund(gbId: string, userId: string): Promise<Participant> {
    const gbObjectId = new Types.ObjectId(gbId);
    const userObjectId = new Types.ObjectId(userId);

    const deletedParticipant = await this.participantRepository.findOneAndDelete({
      gbId: gbObjectId,
      userId: userObjectId,
    });

    if (!deletedParticipant) {
      throw new NotFoundException('참여 내역이 없습니다.');
    }

    return deletedParticipant;
  }
}
