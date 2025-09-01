import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ParticipantService } from './participant.service';
import { Participant } from './schema/participant.schema';
import { ApiOperation } from '@nestjs/swagger';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { UserDecorator } from '../user/decorator/user.decorator';
import { UpdateParticipantDto } from './dto/update-participant.dto';
import { ContextRoleDecorator } from '../group-buying/decorator/context-role.decorator';
import { ContextRole } from '../group-buying/const/context-role.const';
import { GroupBuyingAccessGuard } from '../group-buying/guard/group-buying-access.guard';
/*import { PageOptionDto } from '../common/dto/page-option.dto';
import { PageResponseDto } from '../common/dto/page-response.dto';
import { GroupBuying } from '../group-buying/schema/group-buying.schema';*/
import { JwtAuthGuard } from '../auth/guard/auth.guard';

@Controller('participant')
export class ParticipantController {
  constructor(private readonly participantService: ParticipantService) {}

  /*@ApiOperation({ summary: '내가 참여 중인 공구 목록 조회' })
  @UseGuards(JwtAuthGuard)
  @Get('/my-participant')
  async getParticipatedGroupBuyings(
    @UserDecorator('id') userId: string,
    @Query() optionDto: PageOptionDto,
  ): Promise<PageResponseDto<GroupBuying>> {
    return await this.participantService.getParticipatedGroupBuyings(
      userId,
      optionDto,
    );
  }*/

  @ApiOperation({ summary: '특정 공구의 참여자 목록 조회' })
  @Get('/:gbId')
  async getParticipants(@Param('gbId') gbId: string): Promise<Participant[]> {
    return await this.participantService.getParticipants(gbId);
  }

  @ApiOperation({ summary: '특정 공구의 참여자 상세 조회' })
  @UseGuards(JwtAuthGuard)
  @Get('/:gbId/:id')
  async getParticipantById(
    @Param('gbId') gbId: string,
    @UserDecorator('id') userId: string,
  ): Promise<Participant> {
    return await this.participantService.getParticipantById(gbId, userId);
  }

  @ApiOperation({ summary: '공구 참여' })
  @UseGuards(JwtAuthGuard)
  @Post()
  async joinGroupBuying(
    @UserDecorator('id') userId: string,
    @Body() createDto: CreateParticipantDto,
  ): Promise<Participant> {
    return await this.participantService.joinGroupBuying(createDto, userId);
  }

  @ApiOperation({ summary: '참여자 정보 수정' })
  @UseGuards(JwtAuthGuard)
  @Patch('/:gbId')
  async updateParticipant(
    @Param('gbId') gbId: string, // 해당하는 공구
    @UserDecorator('id') userId: string, // 수정할 참여자 정보
    @Body() updateDto: UpdateParticipantDto, // 업데이트할 내용
  ): Promise<Participant> {
    return await this.participantService.updateParticipant(
      gbId,
      userId,
      updateDto,
    );
  }

  @ApiOperation({ summary: '참여자가 자신의 입금 확인' })
  @UseGuards(JwtAuthGuard, GroupBuyingAccessGuard)
  @Patch('/payment/:gbId')
  async confirmPayment(
    @Param('gbId') gbId: string,
    @UserDecorator('id') userId: string,
    @ContextRoleDecorator() role: ContextRole,
  ) {
    if (role !== ContextRole.PARTICIPANT) {
      throw new ForbiddenException('입금 확인은 참여자만 가능합니다.');
    }
    return await this.participantService.confirmPayment(gbId, userId);
  }

  @ApiOperation({ summary: '공구 참여 취소 (RECRUITING 상태에서만 가능)' })
  @UseGuards(JwtAuthGuard, GroupBuyingAccessGuard)
  @Delete('/:gbId')
  async withdrawGroupBuying(
    @Param('gbId') gbId: string,
    @UserDecorator('id') userId: string,
    @ContextRoleDecorator() role: ContextRole,
  ) {
    // 총대는 자동으로 공구 참여 & 취소 불가
    if (role === ContextRole.LEADER) {
      throw new ForbiddenException('총대는 필수로 공구에 참여해야 합니다.');
    }
    // 해당 공구의 참여자가 아닌 경우 취소 불가
    if (role !== ContextRole.PARTICIPANT) {
      throw new ForbiddenException('참여 취소는 본인만 가능합니다.');
    }

    // 해당 공구의 참여자인 경우 취소 가능
    return await this.participantService.withdrawGroupBuying(gbId, userId);
  }
}
