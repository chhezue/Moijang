import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GroupBuyingService } from './group-buying.service';
import { CreateGroupBuyingDto } from './dto/create-group-buying.dto';
import { ApiOperation } from '@nestjs/swagger';
import { GroupBuying } from './schema/group-buying.schema';
import { UserDecorator } from '../user/decorator/user.decorator';
import { OptionalUserDecorator } from '../user/decorator/optional-user.decorator';
import { UpdateGroupBuyingDto } from './dto/update-group-buying.dto';
import { SearchGroupBuyingDto } from './dto/search-group-buying.dto';
import { PageResponseDto } from '../common/dto/page-response.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { DeleteGroupBuyingDto } from './dto/delete-group-buying.dto';
import { ContextRoleDecorator } from './decorator/context-role.decorator';
import { ContextRole } from './const/context-role.const';
import { GroupBuyingAccessGuard } from './guard/group-buying-access.guard';
import { ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guard/auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guard/optional-auth.guard';
import { PageOptionDto } from '../common/dto/page-option.dto';

@Controller('group-buying')
export class GroupBuyingController {
  constructor(private readonly groupBuyingService: GroupBuyingService) {}

  @ApiOperation({ summary: '전체 공구 목록 조회' })
  @Get()
  async getAllGroupBuyings(
    @Query() searchDto: SearchGroupBuyingDto,
  ): Promise<PageResponseDto<any[]>> {
    return await this.groupBuyingService.getAllGroupBuyings(searchDto);
  }

  @ApiOperation({ summary: '공구 enum 옵션 반환' })
  @Get('/enums')
  async getEnums() {
    return this.groupBuyingService.getEnums();
  }

  @ApiOperation({ summary: '내가 생성한 공구 목록 조회' })
  @UseGuards(JwtAuthGuard)
  @Get('/my-create')
  async getCreatedGroupBuyings(
    @UserDecorator('id') userId: string,
    @Query() optionDto: PageOptionDto,
  ): Promise<PageResponseDto<GroupBuying>> {
    return await this.groupBuyingService.getCreatedGroupBuyings(
      userId,
      optionDto,
    );
  }

  @ApiOperation({ summary: '내가 참여한 공구 목록 조회' })
  @UseGuards(JwtAuthGuard)
  @Get('/my-participant')
  async getParticipantGroupBuyings(
    @UserDecorator('id') userId: string,
    @Query() optionDto: PageOptionDto,
  ): Promise<PageResponseDto<GroupBuying>> {
    return await this.groupBuyingService.getParticipatedGroupBuyings(
      userId,
      optionDto,
    );
  }

  @ApiOperation({ summary: '공구 상세 조회' })
  @UseGuards(OptionalJwtAuthGuard)
  @Get('/:gbId')
  async getGroupBuyingById(
    @Param('gbId') gbId: string,
    @OptionalUserDecorator('id') userId?: string,
  ): Promise<any> {
    return await this.groupBuyingService.getGroupBuyingById(gbId, userId);
  }

  @ApiOperation({ summary: '공구 생성' })
  @UseGuards(JwtAuthGuard)
  @Post()
  async createGroupBuying(
    @UserDecorator('id') userId: string,
    @Body() createDto: CreateGroupBuyingDto,
  ): Promise<GroupBuying> {
    return await this.groupBuyingService.createGroupBuying(userId, createDto);
  }

  @ApiOperation({ summary: '총대가 공구 취소' })
  @UseGuards(JwtAuthGuard, GroupBuyingAccessGuard)
  @Patch('/cancel/:gbId')
  async deleteGroupBuying(
    @UserDecorator('id') userId: string,
    @Param('gbId') gbId: string,
    @Body() deleteDto: DeleteGroupBuyingDto,
    @ContextRoleDecorator() role: ContextRole,
  ) {
    if (role !== ContextRole.LEADER) {
      throw new ForbiddenException('공구 취소는 총대만 가능합니다.');
    }
    return await this.groupBuyingService.deleteGroupBuying(
      userId,
      gbId,
      deleteDto,
    );
  }

  @ApiOperation({ summary: '공구 업데이트' })
  @UseGuards(JwtAuthGuard, GroupBuyingAccessGuard)
  @Patch('/:gbId')
  async updateGroupBuying(
    @UserDecorator('id') userId: string,
    @Param('gbId') gbId: string,
    @Body() updateDto: UpdateGroupBuyingDto,
    @ContextRoleDecorator() role: ContextRole,
  ): Promise<GroupBuying> {
    if (role !== ContextRole.LEADER) {
      throw new ForbiddenException('공구 수정은 총대만 가능합니다.');
    }
    return await this.groupBuyingService.updateGroupBuying(
      userId,
      gbId,
      updateDto,
    );
  }

  @ApiOperation({ summary: '공구 다음 단계로 이동' })
  @UseGuards(JwtAuthGuard, GroupBuyingAccessGuard)
  @Patch('/status/:gbId')
  async updateStatus(
    @Param('gbId') gbId: string,
    @UserDecorator('id') userId: string, // 총대 확인용
    @Body() statusDto: UpdateStatusDto,
    @ContextRoleDecorator() role: ContextRole,
  ): Promise<GroupBuying> {
    if (role !== ContextRole.LEADER) {
      throw new ForbiddenException('공구 상태 변경은 총대만 가능합니다.');
    }
    return this.groupBuyingService.updateStatus(gbId, statusDto);
  }
}
