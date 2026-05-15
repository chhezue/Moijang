import { ParticipantRepository } from '../persistence/participant.repository';
import { Participant } from '../schema/participant.schema';
import { Types } from 'mongoose';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ParticipantQueryService {
  constructor(private readonly participantRepository: ParticipantRepository) {}

  // 내가 해당 공구의 참여자인지 검증
  async isParticipant(userId: string, gbId: string): Promise<boolean> {
    const userObjectId = new Types.ObjectId(userId);
    const gbObjectId = new Types.ObjectId(gbId);
    const participant = await this.participantRepository.findOne({
      userId: userObjectId,
      gbId: gbObjectId,
    });

    return !!participant;
  }

  // 해당 공구의 참여자 목록 반환
  async getParticipants(gbId: string): Promise<Participant[]> {
    return await this.participantRepository.findAll({
      gbId: new Types.ObjectId(gbId),
    });
  }

  // 특정 공구의 참여자 상세 조회
  async getDetailParticipant(gbId: string, userId: string): Promise<Participant> {
    const userObjectId = new Types.ObjectId(userId);
    const gbObjectId = new Types.ObjectId(gbId);

    return await this.participantRepository.findOne({
      gbId: gbObjectId,
      userId: userObjectId,
    });
  }

  // 해당 공구의 참여자 수 반환
  async getParticipantCount(gbId: string): Promise<number> {
    return await this.participantRepository.getTotalCount(gbId);
  }

  // 내가 참여한 공구 목록의 id 배열 반환
  async getJoinedGroupBuyingIds(userId: string) {
    const joinedRecords = await this.participantRepository.find({
      userId: new Types.ObjectId(userId),
    });
    return joinedRecords.map((p) => p.gbId);
  }
}
