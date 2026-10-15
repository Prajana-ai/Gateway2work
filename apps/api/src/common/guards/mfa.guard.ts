import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { DATA_ZONE_KEY } from '../decorators/data-zone.decorator';

@Injectable()
export class MfaGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const dataZone = this.reflector.getAllAndOverride<string>(DATA_ZONE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // MFA is required for protected zone access when user has MFA enabled
    if (dataZone === 'protected') {
      const { user } = context.switchToHttp().getRequest();
      if (user?.mfaEnabled && !user?.mfa) {
        throw new UnauthorizedException(
          'MFA verification required for Protected Data Zone access',
        );
      }
    }

    return true;
  }
}
