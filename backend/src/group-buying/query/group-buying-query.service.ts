import { Injectable, NotFoundException } from '@nestjs/common';
import mongoose, { PipelineStage, Types } from 'mongoose';
import { GroupBuyingRepository } from '../group-buying.repository';
import { GroupBuying } from '../schema/group-buying.schema';
import { SearchGroupBuyingDto } from '../dto/search-group-buying.dto';
import { PageMetaDto, PageResponseDto } from '../../common/dto/page-response.dto';
import { PageOptionDto } from '../../common/dto/page-option.dto';
import { ParticipantQueryService } from '../../participant/query/participant-query.service';

@Injectable()
export class GroupBuyingQueryService {
  constructor(
    private readonly groupBuyingRepository: GroupBuyingRepository,
    private readonly participantQueryService: ParticipantQueryService,
  ) {}

  // 해당 사용자가 이 공구의 총대인지 여부 조회
  async isLeader(userId: string, gbId: string): Promise<boolean> {
    return this.groupBuyingRepository.isLeader(userId, gbId);
  }

  private participantCountLookupStages(): PipelineStage[] {
    return [
      {
        $lookup: {
          from: 'participants',
          localField: '_id',
          foreignField: 'gbId',
          as: 'participantData',
        },
      },
      {
        $addFields: {
          currentCount: {
            $add: [{ $sum: '$participantData.count' }, { $ifNull: ['$leaderCount', 0] }],
          },
        },
      },
    ];
  }

  private leaderLookupStages(): PipelineStage[] {
    return [
      {
        $lookup: {
          from: 'users',
          localField: 'leaderId',
          foreignField: '_id',
          as: 'leaderId',
        },
      },
      {
        $unwind: { path: '$leaderId', preserveNullAndEmptyArrays: true },
      },
    ];
  }

  private listPipelineStages(
    match: Record<string, unknown>,
    page: number,
    limit: number,
  ): PipelineStage[] {
    return [
      { $match: match },
      { $addFields: { id: '$_id' } },
      ...this.participantCountLookupStages(),
      ...this.leaderLookupStages(),
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      { $project: { participantData: 0 } },
    ];
  }

  // "현재 공구의 총 수량" 반환 (participant 합 + leader 합)
  async getEffectiveCurrentCount(gbId: string): Promise<number> {
    const participantTotal = await this.participantQueryService.getParticipantCount(gbId); // 일반 참여자 합 (총대 제외)
    const gb = await this.groupBuyingRepository.findOneByGbId(gbId);
    return participantTotal + (gb?.leaderCount ?? 0);
  }

  // 전체 공구 반환 (검색 포함)
  async getAllGroupBuyings(searchDto: SearchGroupBuyingDto) {
    const { keyword, category, status, page = 1, limit = 10 } = searchDto;

    const countQuery: Record<string, unknown> = {};

    if (keyword) {
      countQuery['title'] = { $regex: keyword, $options: 'i' };
    }
    if (category) {
      countQuery['category'] = category;
    }
    if (status) {
      countQuery['groupBuyingStatus'] = status;
    }

    const totalCount = await this.groupBuyingRepository.count(countQuery);
    const list = await this.groupBuyingRepository.aggregate(
      this.listPipelineStages(countQuery, page, limit),
    );
    const pageMetaDto = new PageMetaDto({
      pageOptionDto: { page, limit },
      totalItems: totalCount,
    });

    return {
      data: list,
      meta: pageMetaDto,
    };
  }

  // 내가 주최한 공구 목록 반환
  async getGroupBuyingsAsLeader(
    userId: string,
    optionDto: PageOptionDto,
  ): Promise<PageResponseDto<GroupBuying>> {
    const { page, limit } = optionDto;
    const userObjectId = new Types.ObjectId(userId);

    const totalCount = await this.groupBuyingRepository.count({
      leaderId: userObjectId,
    });

    const list = await this.groupBuyingRepository.aggregate(
      this.listPipelineStages({ leaderId: userObjectId }, page, limit),
    );
    const pageMetaDto = new PageMetaDto({
      pageOptionDto: { page, limit },
      totalItems: totalCount,
    });

    return {
      data: list,
      meta: pageMetaDto,
    };
  }

  // 내가 참여한 공구 목록 반환 (주최한 공구 제외)
  async getGroupBuyingsAsParticipant(
    userId: string,
    optionDto: PageOptionDto,
  ): Promise<PageResponseDto<GroupBuying>> {
    const { page, limit } = optionDto;
    const userObjectId = new Types.ObjectId(userId);

    const joinedIds = await this.participantQueryService.getJoinedGroupBuyingIds(userId);
    const myGbs = await this.groupBuyingRepository.find({ leaderId: userObjectId });
    const totalCount = joinedIds.length - myGbs.length;

    const list = await this.groupBuyingRepository.aggregate(
      this.listPipelineStages(
        {
          _id: { $in: joinedIds },
          leaderId: { $ne: userObjectId },
        },
        page,
        limit,
      ),
    );
    const pageMetaDto = new PageMetaDto({
      pageOptionDto: { page, limit },
      totalItems: totalCount,
    });

    return {
      data: list,
      meta: pageMetaDto,
    };
  }

  // 단일 공구 상세 조회
  async getGroupBuyingById(gbId: string, userId?: string): Promise<any> {
    const objectIdGbId = new mongoose.Types.ObjectId(gbId);

    const pipeline: PipelineStage[] = [
      { $match: { _id: objectIdGbId } },
      { $addFields: { id: '$_id' } },
      ...this.participantCountLookupStages(),
      ...this.leaderLookupStages(),
      {
        $project: {
          participantData: 0,
          'leaderId._id': 0,
          'leaderId.updatedAt': 0,
        },
      },
    ];

    const data = await this.groupBuyingRepository.aggregate(pipeline);
    if (!data.length) {
      throw new NotFoundException(`공구 ${gbId}가 존재하지 않습니다.`);
    }
    const gb = data[0];

    // 로그인하지 않은 경우
    if (!userId) {
      return { ...gb, isOwner: false, isParticipant: false };
    }

    // 로그인한 경우, 총대인지 참여자인지 판별
    const isOwner = await this.isLeader(userId, gbId);
    if (isOwner) {
      return { ...gb, isOwner, isParticipant: false };
    }

    const isParticipant = await this.participantQueryService.isParticipant(userId, gbId);
    if (isParticipant) {
      const participantInfo = await this.participantQueryService.getDetailParticipant(gbId, userId);
      const { count } = participantInfo;

      return {
        ...gb,
        isOwner: false,
        isParticipant,
        participantInfo: { count },
      };
    }

    return { ...gb, isOwner: false, isParticipant: false };
  }
}
