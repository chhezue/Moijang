import { BadRequestException, Injectable } from "@nestjs/common";
import {
  AggregateOptions,
  FilterQuery,
  Model,
  PipelineStage,
  RootFilterQuery,
  Types,
} from "mongoose";
import { GroupBuying } from "./schema/group-buying.schema";
import { InjectModel } from "@nestjs/mongoose";
import { CreateGroupBuyingDto } from "./dto/create-group-buying.dto";
import { UpdateGroupBuyingDto } from "./dto/update-group-buying.dto";
import { SearchGroupBuyingDto } from "./dto/search-group-buying.dto";
import { PageOptionDto } from "../common/dto/page-option.dto";
import { CancelReason, GroupBuyingStatus } from "./const/group-buying.const";
import { CommonService } from "../common/common.service";
import { PageResponseDto } from "../common/dto/page-response.dto";

@Injectable()
export class GroupBuyingRepository {
  constructor(
    @InjectModel(GroupBuying.name)
    private groupBuyingModel: Model<GroupBuying>,
    private readonly commonService: CommonService,
  ) {}

  async count(query: RootFilterQuery<GroupBuying>) {
    return this.groupBuyingModel.countDocuments(query);
  }

  async aggregate(pipeline: PipelineStage[], option?: AggregateOptions) {
    return this.groupBuyingModel.aggregate(pipeline, option);
  }

  async isLeader(userId: string, gbId: string): Promise<boolean> {
    const userObjectId = new Types.ObjectId(userId);
    const groupBuying = await this.groupBuyingModel.findOne({
      _id: gbId,
      leaderId: userObjectId,
    });

    return !!groupBuying;
  }

  async create(
    id: string,
    createDto: CreateGroupBuyingDto,
    estimatedPrice: number,
  ): Promise<GroupBuying> {
    const leaderObjectId = new Types.ObjectId(id);
    return this.groupBuyingModel.create({
      ...createDto,
      estimatedPrice,
      leaderId: leaderObjectId,
    });
  }

  async findByGbIdAndUpdate(
    gbId: string,
    updateDto: UpdateGroupBuyingDto,
    estimatedPrice: number,
  ): Promise<GroupBuying> {
    return this.groupBuyingModel.findByIdAndUpdate(
      gbId,
      { $set: { ...updateDto, estimatedPrice } },
      { new: true },
    );
  }

  async findByGbIdAndDelete(
    gbId: string,
    cancelReason: CancelReason,
  ): Promise<GroupBuying> {
    return this.groupBuyingModel.findByIdAndUpdate(
      gbId,
      {
        $set: {
          groupBuyingStatus: GroupBuyingStatus.CANCELLED,
          cancelReason,
        },
      },
      { new: true },
    );
  }

  async updateStatus(gbId: string, status: GroupBuyingStatus) {
    return this.groupBuyingModel.findByIdAndUpdate(
      gbId,
      { $set: { groupBuyingStatus: status } },
      { new: true },
    );
  }

  async getCurrentCount(
    gbId: string,
    quantityChange: number,
    beforeTotalCount: number,
  ): Promise<GroupBuying | null> {
    // 변경량이 0이면 아무 작업도 하지 않음
    if (quantityChange === 0) {
      return this.groupBuyingModel.findById(gbId).exec();
    }

    const gb = await this.groupBuyingModel.findOne({ _id: gbId });
    if (beforeTotalCount + quantityChange > gb.fixedCount) {
      throw new BadRequestException(
        "모집 인원이 마감되었거나 정원을 초과합니다.",
      );
    }

    return gb;
  }

  async findOneByGbId(gbId: string) {
    return this.groupBuyingModel.findOne({ _id: gbId }).populate({
      path: "leaderId",
      select: "displayName department",
    });
  }

  async findAndCount(
    searchDto: SearchGroupBuyingDto,
  ): Promise<PageResponseDto<GroupBuying>> {
    // 필터링 조건 객체 생성
    const query: FilterQuery<GroupBuying> = {};

    // 키워드 검색: title 또는 description에서 검색 (OR 조건)
    if (searchDto?.keyword) {
      query.$or = [
        { title: { $regex: searchDto.keyword, $options: "i" } },
        { description: { $regex: searchDto.keyword, $options: "i" } },
      ];
    }

    // 카테고리 필터: 정확한 매칭 (AND 조건으로 연결)
    if (searchDto?.category) {
      query.productCategory = searchDto.category;
    }

    // 상태 필터: 정확한 매칭 (AND 조건으로 연결)
    if (searchDto?.status) {
      query.groupBuyingStatus = searchDto.status;
    }

    const populateOptions = {
      path: "leaderId",
      select: "displayName department",
    };

    return this.commonService.findWithPagination(
      this.groupBuyingModel,
      query,
      searchDto,
      populateOptions,
    );
  }

  async findAndCountByUserId(
    userId: string,
    optionDto: PageOptionDto,
  ): Promise<PageResponseDto<GroupBuying>> {
    const userObjectId = new Types.ObjectId(userId);
    const query: FilterQuery<GroupBuying> = { leaderId: userObjectId }; // 필터링 조건 객체 생성

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

  async find(query: RootFilterQuery<GroupBuying>) {
    return this.groupBuyingModel.find(query);
  }
}
