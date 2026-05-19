import { Injectable } from '@nestjs/common';
import { Model, ProjectionType, QueryOptions, RootFilterQuery, Types, UpdateQuery } from 'mongoose';
import { Participant } from '../schema/participant.schema';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class ParticipantRepository {
  constructor(
    @InjectModel(Participant.name)
    private participantModel: Model<Participant>,
  ) {}

  async create(doc: any): Promise<Participant> {
    return this.participantModel.create(doc);
  }

  async findAll(query: any) {
    return this.participantModel.find(query).populate({
      path: 'userId',
      select: 'displayName department',
    });
  }

  async findOne(query: any) {
    return this.participantModel.findOne(query);
  }

  async findOneAndUpdate(query: any, update: UpdateQuery<Participant>, options: { new: boolean }) {
    return this.participantModel.findOneAndUpdate(query, update, options);
  }

  async findOneAndDelete(query: any) {
    // 먼저 문서를 찾고, 삭제 후 찾은 문서를 반환
    const document = await this.participantModel.findOne(query);
    if (document) {
      await this.participantModel.deleteOne(query);
      return document;
    }
    return null;
  }

  async find(
    query: RootFilterQuery<Participant>,
    projection?: ProjectionType<Participant>,
    option?: QueryOptions<Participant>,
  ) {
    return this.participantModel.find(query, projection, option);
  }

  // 일반 참여자 합 (총대 제외)
  async getParticipantCount(gbId: string): Promise<number> {
    const gbObjectId = new Types.ObjectId(gbId);
    const result = await this.participantModel.aggregate([
      {
        $match: {
          gbId: gbObjectId,
        },
      },
      {
        $group: {
          _id: null, // gbid가 모두 동일하므로 그룹화 기준은 null로 설정
          totalCount: { $sum: '$count' },
        },
      },
      {
        $project: {
          _id: 0,
          totalCount: 1,
        },
      },
    ]);
    return result[0]?.totalCount || 0;
  }
}
