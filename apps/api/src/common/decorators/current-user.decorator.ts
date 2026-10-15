import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface RequestUser {
  id: string;
  tenantId: string;
  email: string;
  roleId: string;
  roleName: string;
  zones: string[];
  mfa: boolean;
  mfaEnabled: boolean;
}

export const CurrentUser = createParamDecorator(
  (data: keyof RequestUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: RequestUser = request.user;
    return data ? user[data] : user;
  },
);
