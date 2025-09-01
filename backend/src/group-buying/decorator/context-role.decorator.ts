import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ContextRole } from '../const/context-role.const';

export const ContextRoleDecorator = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ContextRole => {
    const contextType = ctx.getType<'http' | 'ws'>();

    let contextualRole: ContextRole;

    if (contextType === 'http') {
      const request = ctx.switchToHttp().getRequest();
      contextualRole = request.contextualRole;
    } else if (contextType === 'ws') {
      const client = ctx.switchToWs().getClient();
      contextualRole = client.contextualRole;
    } else {
      throw new Error('지원하지 않는 요청 유형입니다.');
    }

    if (!contextualRole) {
      throw new Error('ContextRole decorator는 Guard와 함께 사용해야 합니다.');
    }

    return contextualRole;
  },
);
