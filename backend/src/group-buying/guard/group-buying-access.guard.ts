import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ParticipantService } from '../../participant/participant.service';
import { User } from '../../user/schema/user.schema';
import { GroupBuyingService } from '../group-buying.service';
import { ContextRole } from '../const/context-role.const';

@Injectable()
export class GroupBuyingAccessGuard implements CanActivate {
  constructor(
    private readonly participantService: ParticipantService,
    private readonly groupBuyingService: GroupBuyingService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const contextType = context.getType<'http' | 'ws'>();

    let user: User;
    let gbId: string;
    let req: any; // http request 객체를 담을 변수
    let client: any; // ws client 객체를 담을 변수

    if (contextType === 'http') {
      req = context.switchToHttp().getRequest();
      user = req.user;
      gbId = req.gbId || req.params?.gbId;
    } else if (contextType === 'ws') {
      client = context.switchToWs().getClient();
      const data = context.switchToWs().getData();
      user = client.user;
      gbId = typeof data === 'string' ? data : data.gbId;
    } else {
      throw new ForbiddenException('지원하지 않는 요청 유형입니다.');
    }

    if (!user) throw new ForbiddenException('유저 정보가 없습니다.');
    if (!gbId) throw new ForbiddenException('공구 ID가 없습니다.');

    // 해당 공구의 리더인지 확인
    const isLeader = await this.groupBuyingService.isLeader(user.id, gbId);
    if (isLeader) {
      // 컨텍스트에 맞는 객체에 역할을 저장
      if (req) req.contextualRole = ContextRole.LEADER;
      if (client) client.contextualRole = ContextRole.LEADER;
      return true;
    }

    // 해당 공구의 참여자인지 확인
    const isParticipant = await this.participantService.isParticipant(
      user.id,
      gbId,
    );
    console.log('isParticipant', isParticipant);
    if (isParticipant) {
      if (req) req.contextualRole = ContextRole.PARTICIPANT;
      if (client) client.contextualRole = ContextRole.PARTICIPANT;
      return true;
    }

    throw new ForbiddenException('해당 공구에 대한 권한이 없습니다.');
  }
}
