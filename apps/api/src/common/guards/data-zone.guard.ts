import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DATA_ZONE_KEY } from '../decorators/data-zone.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class DataZoneGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiredZone = this.reflector.getAllAndOverride<string>(
      DATA_ZONE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredZone) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user?.zones?.includes(requiredZone)) {
      throw new ForbiddenException(
        `Insufficient permissions for ${requiredZone} data zone`,
      );
    }

    return true;
  }
}
