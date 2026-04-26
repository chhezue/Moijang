import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { GroupBuyingRepository } from "./group-buying.repository";
import { CreateGroupBuyingDto } from "./dto/create-group-buying.dto";
import { GroupBuying } from "./schema/group-buying.schema";
import {
  CANCEL_REASON_LABELS,
  CancelReason,
  getEnumOptions,
  GROUP_BUYING_STATUS_LABELS,
  GroupBuyingStatus,
  PRODUCT_CATEGORY_LABELS,
  ProductCategory,
} from "./const/group-buying.const";
import { UpdateGroupBuyingDto } from "./dto/update-group-buying.dto";
import { SearchGroupBuyingDto } from "./dto/search-group-buying.dto";
import { PageMetaDto, PageResponseDto } from "../common/dto/page-response.dto";
import { PageOptionDto } from "../common/dto/page-option.dto";
import { UpdateStatusDto } from "./dto/update-status.dto";
import { DeleteGroupBuyingDto } from "./dto/delete-group-buying.dto";
import { ParticipantService } from "../participant/participant.service";
import { PayloadDto } from "../web-push/dto/payload.dto";
import { WebPushService } from "../web-push/web-push.service";
import mongoose, { PipelineStage, Types } from "mongoose";

@Injectable()
export class GroupBuyingService {
  constructor(
    private readonly groupBuyingRepository: GroupBuyingRepository,
    private readonly participantService: ParticipantService,
    private readonly webPushService: WebPushService,
  ) {}

  async isLeader(userId: string, gbId: string): Promise<boolean> {
    return await this.groupBuyingRepository.isLeader(userId, gbId);
  }

  // 상태 전이 검증 함수
  private isValidTransition(
    current: GroupBuyingStatus,
    next: GroupBuyingStatus,
  ): boolean {
    // key는 반드시 GroupBuyingStatus 중 하나, 각 value는 GroupBuyingStatus 배열 타입
    const allowedTransition: Record<GroupBuyingStatus, GroupBuyingStatus[]> = {
      // 모집 중 -> 모집 완료, 취소
      [GroupBuyingStatus.RECRUITING]: [
        GroupBuyingStatus.CONFIRMED,
        GroupBuyingStatus.CANCELLED,
      ],
      // 모집 완료 -> 품절로 인한 취소
      [GroupBuyingStatus.CONFIRMED]: [GroupBuyingStatus.CANCELLED],
      // 주문 대기 -> 주문 진행 중, 품절로 인한 취소
      [GroupBuyingStatus.ORDER_PENDING]: [
        GroupBuyingStatus.ORDERED,
        GroupBuyingStatus.CANCELLED,
      ],
      // 주문 진행 중 -> 배송 완료, 품절로 인한 취소
      [GroupBuyingStatus.ORDERED]: [
        GroupBuyingStatus.SHIPPED,
        GroupBuyingStatus.CANCELLED,
      ],
      [GroupBuyingStatus.SHIPPED]: [GroupBuyingStatus.COMPLETED],
      [GroupBuyingStatus.CANCELLED]: [],
      [GroupBuyingStatus.COMPLETED]: [],
    };

    return allowedTransition[current].includes(next);
  }

  async getAllGroupBuyings(searchDto: SearchGroupBuyingDto) {
    // total count
    const { keyword, category, status, page = 1, limit = 10 } = searchDto;

    const countQuery = {};

    if (keyword) {
      countQuery["title"] = { $regex: keyword, $options: "i" };
    }
    if (category) {
      countQuery["category"] = category;
    }
    if (status) {
      countQuery["groupBuyingStatus"] = status;
    }

    const totalCount = await this.groupBuyingRepository.count(countQuery);

    const pipeline: PipelineStage[] = [
      {
        $match: countQuery,
      },
      {
        $addFields: {
          id: "$_id",
        },
      },
      {
        $lookup: {
          from: "participants",
          let: { groupBuyIdAsString: { $toString: "$_id" } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$gbId", "$$groupBuyIdAsString"],
                },
              },
            },
          ],
          as: "participantData",
        },
      },
      {
        $addFields: {
          currentCount: { $sum: "$participantData.count" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "leaderId",
          foreignField: "id",
          as: "leaderId",
        },
      },
      {
        $unwind: { path: "$leaderId", preserveNullAndEmptyArrays: true },
      },
      {
        $sort: {
          createdAt: -1, // 예시: 최신순으로 정렬
        },
      },
      {
        $skip: (page - 1) * limit,
      },
      {
        $limit: limit,
      },
      {
        $project: {
          participantData: 0,
        },
      },
    ];
    const list = await this.groupBuyingRepository.aggregate(pipeline);
    const pageMetaDto = new PageMetaDto({
      pageOptionDto: { page, limit },
      totalItems: totalCount,
    });

    return {
      data: list,
      meta: pageMetaDto,
    };
  }

  async getCreatedGroupBuyings(
    userId: string,
    optionDto: PageOptionDto,
  ): Promise<PageResponseDto<GroupBuying>> {
    const { page, limit } = optionDto;

    const totalCount = await this.groupBuyingRepository.count({
      leaderId: userId,
    });

    const pipeline: PipelineStage[] = [
      {
        $match: { leaderId: userId },
      },
      {
        $addFields: {
          id: "$_id",
        },
      },
      {
        $lookup: {
          from: "participants",
          let: { groupBuyIdAsString: { $toString: "$_id" } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$gbId", "$$groupBuyIdAsString"],
                },
              },
            },
          ],
          as: "participantData",
        },
      },
      {
        $addFields: {
          currentCount: { $sum: "$participantData.count" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "leaderId",
          foreignField: "id",
          as: "leaderId",
        },
      },
      {
        $unwind: { path: "$leaderId", preserveNullAndEmptyArrays: true },
      },
      {
        $sort: {
          createdAt: -1, // 예시: 최신순으로 정렬
        },
      },
      {
        $skip: (page - 1) * limit,
      },
      {
        $limit: limit,
      },
      {
        $project: {
          participantData: 0,
        },
      },
    ];
    const list = await this.groupBuyingRepository.aggregate(pipeline);
    const pageMetaDto = new PageMetaDto({
      pageOptionDto: { page, limit },
      totalItems: totalCount,
    });
    return {
      data: list,
      meta: pageMetaDto,
    };
  }

  async getParticipatedGroupBuyings(
    userId: string,
    optionDto: PageOptionDto,
  ): Promise<PageResponseDto<GroupBuying>> {
    const { page, limit } = optionDto;

    const groupbuyingIds =
      await this.participantService.getParticipatedGroupBuyingIds(userId);

    const myGroupbuying = await this.groupBuyingRepository.find({
      leaderId: userId,
    });
    const totalCount = groupbuyingIds.length - myGroupbuying.length;

    const pipeline: PipelineStage[] = [
      {
        $match: { _id: { $in: groupbuyingIds }, leaderId: { $ne: userId } },
      },
      {
        $addFields: {
          id: "$_id",
        },
      },
      {
        $lookup: {
          from: "participants",
          let: { groupBuyIdAsString: { $toString: "$_id" } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$gbId", "$$groupBuyIdAsString"],
                },
              },
            },
          ],
          as: "participantData",
        },
      },
      {
        $addFields: {
          currentCount: { $sum: "$participantData.count" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "leaderId",
          foreignField: "id",
          as: "leaderId",
        },
      },
      {
        $unwind: { path: "$leaderId", preserveNullAndEmptyArrays: true },
      },
      {
        $sort: {
          createdAt: -1, // 예시: 최신순으로 정렬
        },
      },
      {
        $skip: (page - 1) * limit,
      },
      {
        $limit: limit,
      },
      {
        $project: {
          participantData: 0,
        },
      },
    ];
    const list = await this.groupBuyingRepository.aggregate(pipeline);
    const pageMetaDto = new PageMetaDto({
      pageOptionDto: { page, limit },
      totalItems: totalCount,
    });
    return {
      data: list,
      meta: pageMetaDto,
    };
  }

  async getGroupBuyingById(gbId: string, userId?: string): Promise<any> {
    const objectIdGbId = new mongoose.Types.ObjectId(gbId);

    const pipeline = [
      {
        $match: { _id: objectIdGbId },
      },
      {
        $addFields: {
          id: "$_id",
        },
      },
      {
        $lookup: {
          from: "participants",
          let: { groupBuyIdAsString: { $toString: "$_id" } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$gbId", "$$groupBuyIdAsString"],
                },
              },
            },
          ],
          as: "participantData",
        },
      },
      {
        $addFields: {
          currentCount: { $sum: "$participantData.count" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "leaderId",
          foreignField: "id",
          as: "leaderId",
        },
      },
      {
        $unwind: { path: "$leaderId", preserveNullAndEmptyArrays: true },
      },
      {
        // 1단계: nonDepositors 배열 (Participant의 _id로 추정)을 사용해 참여자 정보 조회
        $lookup: {
          from: "participants",
          let: {
            nonDepositorPIds: {
              $map: {
                input: "$nonDepositors",
                as: "idStr",
                in: { $toObjectId: "$$idStr" },
              },
            },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$_id", "$$nonDepositorPIds"],
                },
              },
            },
            // 2단계: 1단계에서 찾은 참여자 정보의 userId를 사용해 유저 정보 조회
            {
              $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "id",
                as: "userInfo",
              },
            },
            {
              $unwind: "$userInfo",
            },
            // 최종적으로 원하는 유저 정보 형태로 교체
            {
              $replaceRoot: { newRoot: "$userInfo" },
            },
          ],
          as: "nonDepositors",
        },
      },
      {
        $project: {
          participantData: 0,
          "leaderId._id": 0,
          "leaderId.updatedAt": 0,
          "nonDepositors._id": 0,
          "nonDepositors.updatedAt": 0,
        },
      },
    ];

    const data = await this.groupBuyingRepository.aggregate(pipeline);
    if (!data) {
      throw new NotFoundException(`공구 ${gbId}가 존재하지 않습니다.`);
    }
    const gb = data[0];

    const { count } = await this.participantService.getParticipantById(
      gbId,
      gb.leaderId.id,
    );

    gb.leaderCount = count;
    // 로그인하지 않은 경우
    if (!userId) {
      return { ...gb, isOwner: false, isParticipant: false };
    }

    // 로그인한 경우: 소유자인지 확인
    const isOwner = await this.isLeader(userId, gbId);
    if (isOwner) {
      return { ...gb, isOwner: isOwner, isParticipant: false };
    }

    // 로그인한 경우: 참여자인지 확인
    const isParticipant = await this.participantService.isParticipant(
      userId,
      gbId,
    );
    if (isParticipant) {
      const participantInfo = await this.participantService.getParticipantById(
        gbId,
        userId,
      );
      const { count } = participantInfo;

      return {
        ...gb,
        isOwner: false,
        isParticipant: isParticipant,
        participantInfo: {
          count,
        },
      };
    }

    return { ...gb, isOwner: false, isParticipant: false }; // 공구 참여 가능
  }

  async createGroupBuying(
    id: string,
    createDto: CreateGroupBuyingDto,
  ): Promise<GroupBuying> {
    const { fixedCount, totalPrice, shippingFee, leaderCount } = createDto;
    const estimatedPriceWithDecimal = (totalPrice + shippingFee) / fixedCount;
    const estimatedPrice = Math.ceil(estimatedPriceWithDecimal);

    const result = await this.groupBuyingRepository.create(
      id,
      createDto,
      estimatedPrice,
    );
    const _id: string = result._id as string;
    await this.participantService.createLeader(_id, leaderCount, id);

    return result;
  }

  async deleteGroupBuying(
    userId: string,
    gbId: string,
    deleteDto: DeleteGroupBuyingDto,
  ): Promise<GroupBuying> {
    const gb = await this.getGroupBuyingById(gbId, userId);
    if (!gb) {
      throw new NotFoundException(`공구 '${gbId}'가 존재하지 않습니다.`);
    }

    const uncancelableStatuses = [
      GroupBuyingStatus.SHIPPED,
      GroupBuyingStatus.COMPLETED,
      GroupBuyingStatus.CANCELLED,
    ];
    if (uncancelableStatuses.includes(gb.groupBuyingStatus)) {
      throw new BadRequestException(
        "현재 상태에서는 공구를 취소할 수 없습니다.",
      );
    }

    // 2. 취소 사유에 따른 데이터 준비 (알림 메시지, 미입금자 목록)
    let notificationBody = "";
    let nonDepositors: string[] = [];

    switch (deleteDto.cancelReason) {
      case CancelReason.LEADER_CANCELLED: // 총대 개인 사유
        notificationBody = `[${gb.title}] 총대님이 개인 사정으로 공구를 취소했어요. 자세한 내용은 공지사항을 확인해주세요.`;
        break;

      case CancelReason.PRODUCT_UNAVAILABLE: // 상품 품절 또는 가격 변동
        notificationBody = `[${gb.title}] 상품 품절 또는 가격 변동으로 공구가 취소되었어요. 곧 총대님이 환불을 진행할 예정이에요.`;
        break;

      default:
        throw new BadRequestException("유효하지 않은 취소 사유입니다.");
    }

    const participants: any =
      await this.participantService.getParticipants(gbId);
    if (participants.length > 0 && notificationBody) {
      const payload: PayloadDto = {
        title: `❌ 공구 취소`,
        body: notificationBody,
        url: `${process.env.FRONT_URL}/group-buying/detail/${gbId}`,
      };

      // Promise.all을 사용해 모든 알림을 병렬로 동시에 보냅니다. (성능 향상)
      const notificationPromises = participants.map((participant) =>
        this.webPushService.sendNotification(participant.userId.id, payload),
      );
      await Promise.all(notificationPromises);
    }

    return this.groupBuyingRepository.findByGbIdAndDelete(
      gbId,
      deleteDto.cancelReason,
      nonDepositors, // nonDepositors가 없는 경우는 빈 배열 전달
    );
  }

  async updateGroupBuying(
    userId: string,
    gbId: string,
    updateDto: UpdateGroupBuyingDto,
  ): Promise<GroupBuying> {
    const gb = await this.getGroupBuyingById(gbId, userId);
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

    const estimatedPriceWithDecimal =
      (totalPrice + shippingFee) / gb.fixedCount;
    const estimatedPrice = Math.ceil(estimatedPriceWithDecimal);

    if (
      gb.groupBuyingStatus !== GroupBuyingStatus.RECRUITING && // 공구 전체 수정 가능
      gb.groupBuyingStatus !== GroupBuyingStatus.CONFIRMED && // 최종 가격 수정 가능
      gb.groupBuyingStatus !== GroupBuyingStatus.SHIPPED // 픽업 장소, 시간 수정 가능
    ) {
      throw new BadRequestException(
        "공구 수정은 모집 중/모집 완료/배송 완료 상태일 때만 가능합니다.",
      );
    }

    // 공구 업데이트
    const result = await this.groupBuyingRepository.findByGbIdAndUpdate(
      gbId,
      updateDto,
      estimatedPrice,
    );

    // 리더의 참여 수량이 변경되었으면 호출
    if (updateDto.leaderCount) {
      await this.participantService.updateLeader(
        gbId,
        updateDto.leaderCount,
        userId,
      );
    }

    const totalCount = await this.participantService.getTotalCount(gbId);

    // 모집 개수가 다 찼고 아직 모집 중 상태라면 즉시 확정으로 변경
    if (
      totalCount >= gb.fixedCount &&
      gb.groupBuyingStatus === GroupBuyingStatus.RECRUITING
    ) {
      await this.groupBuyingRepository.updateStatus(
        gbId,
        GroupBuyingStatus.CONFIRMED,
      );
    }

    return result;
  }

  async updateStatus(gbId: string, statusDto: UpdateStatusDto) {
    const gb = await this.groupBuyingRepository.findOneByGbId(gbId);
    if (!gb) {
      throw new NotFoundException(`공구 ${gbId}가 존재하지 않습니다.`);
    }

    const current = gb.groupBuyingStatus;
    const next = statusDto.status;

    if (
      current === GroupBuyingStatus.COMPLETED ||
      current === GroupBuyingStatus.CANCELLED
    ) {
      throw new BadRequestException(
        "현재 상태에서는 더 이상 상태를 변경할 수 없습니다.",
      );
    }

    // 상태 전이 제한
    if (!this.isValidTransition(current, next)) {
      throw new BadRequestException("올바르지 않은 상태 전이입니다.");
    }

    const participants: any =
      await this.participantService.getParticipants(gbId);

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
            payload.title = "📢 주문 완료";
            payload.body = `[${gb.title}] 총대가 상품 주문을 완료했어요. 배송이 시작되면 다시 알려드릴게요.`;
            break;
          case GroupBuyingStatus.SHIPPED:
            payload.title = "📢 상품 도착";
            payload.body = `[${gb.title}] 주문하신 상품이 도착했어요. 총대가 작성한 픽업 공지를 확인해주세요.`;
            break;
          case GroupBuyingStatus.CANCELLED:
            payload.title = "📢 공구 취소";
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

    return await this.groupBuyingRepository.updateStatus(
      gbId,
      statusDto.status,
    );
  }

  // 각 enum 값에 대한 한글 텍스트 매핑 객체를 프론트엔드에 반환
  async getEnums() {
    return {
      status: getEnumOptions(GroupBuyingStatus, GROUP_BUYING_STATUS_LABELS),
      category: getEnumOptions(ProductCategory, PRODUCT_CATEGORY_LABELS),
      cancelReason: getEnumOptions(CancelReason, CANCEL_REASON_LABELS),
    };
  }
}
