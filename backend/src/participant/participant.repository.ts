import { Injectable } from "@nestjs/common";
import {
  FilterQuery,
  Model,
  ProjectionType,
  QueryOptions,
  RootFilterQuery,
  Types,
  UpdateQuery,
} from "mongoose";
import { Participant } from "./schema/participant.schema";
import { InjectModel } from "@nestjs/mongoose";
import { PageOptionDto } from "../common/dto/page-option.dto";
import { GroupBuying } from "../group-buying/schema/group-buying.schema";
import { CommonService } from "../common/common.service";
import { PageResponseDto } from "../common/dto/page-response.dto";

@Injectable()
export class ParticipantRepository {
  constructor(
    @InjectModel(Participant.name)
    private participantModel: Model<Participant>,
    @InjectModel(GroupBuying.name)
    private groupBuyingModel: Model<GroupBuying>,
    private readonly commonService: CommonService,
  ) {}

  async create(doc: any): Promise<Participant> {
    return this.participantModel.create(doc);
  }

  async findAll(query: any) {
    return this.participantModel.find(query).populate({
      path: "userId",
      select: "displayName department",
    });
  }

  async findOne(query: any) {
    return this.participantModel.findOne(query);
  }

  async findOneAndUpdate(
    query: any,
    update: UpdateQuery<Participant>,
    options: { new: boolean },
  ) {
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

  async findAndCountParticipants(
    userId: string,
    optionDto: PageOptionDto,
  ): Promise<PageResponseDto<GroupBuying>> {
    const userObjectId = new Types.ObjectId(userId);
    // 1. 내가 참여한 모든 groupBuying의 ID 목록 조회
    const participatedRecords = await this.participantModel
      .find({ userId: userObjectId })
      .lean();
    const participatedGbIds = participatedRecords.map((p) => p.gbId);

    // 참여한 공구가 없으면 null 반환
    if (participatedGbIds.length === 0) {
      return null;
    }

    // 2. 필터링 조건 생성: 참여했고(in) AND 내가 리더가 아닌(ne) 것
    const query: FilterQuery<GroupBuying> = {
      _id: { $in: participatedGbIds },
      leaderId: { $ne: userObjectId },
    };

    const populateOptions = {
      path: "leaderId",
      select: "displayName department",
    };

    return this.commonService.findWithPagination(
      this.groupBuyingModel,
      query,
      optionDto,
      populateOptions,
    );
  }

  async getTotalCount(gbId: string): Promise<number> {
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
          totalCount: { $sum: "$count" },
        },
      },
      {
        $project: {
          _id: 0,
          totalCount: 1,
        },
      },
    ]);
    return result[0].totalCount;
  }
}
