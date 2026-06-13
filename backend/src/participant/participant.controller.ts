import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ParticipantService } from './participant.service';
import { Participant } from './schema/participant.schema';
import { ApiOperation } from '@nestjs/swagger';
import { UserDecorator } from '../user/decorator/user.decorator';
import { JwtAuthGuard } from '../auth/guard/auth.guard';
import { ParticipantQueryService } from './query/participant-query.service';

@Controller('participant')
export class ParticipantController {
  constructor(
    private readonly participantService: ParticipantService,
    private readonly participantQueryService: ParticipantQueryService,
  ) {}

  @ApiOperation({ summary: '특정 공구의 참여자 목록 조회' })
  @Get('/:gbId')
  async getParticipants(@Param('gbId') gbId: string): Promise<Participant[]> {
    return await this.participantQueryService.getParticipants(gbId);
  }

  @ApiOperation({ summary: '특정 공구의 참여자 상세 조회' })
  @UseGuards(JwtAuthGuard)
  @Get('/:gbId/:id')
  async getParticipantById(
    @Param('gbId') gbId: string,
    @UserDecorator('id') userId: string,
  ): Promise<Participant> {
    return await this.participantQueryService.getDetailParticipant(gbId, userId);
  }
}
