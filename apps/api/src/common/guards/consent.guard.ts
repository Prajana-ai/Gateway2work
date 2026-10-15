import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRES_CONSENT_KEY } from '../decorators/requires-consent.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class ConsentGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private databaseService: DatabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiresConsent = this.reflector.getAllAndOverride<boolean>(
      REQUIRES_CONSENT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiresConsent) return true;

    const request = context.switchToHttp().getRequest();
    const participantId = request.params.participantId || request.params.id;
    const user = request.user;

    // Compliance admins can bypass consent checks
    if (user?.roleName === 'compliance_admin') return true;

    if (!participantId || !user?.tenantId) return true;

    // Check consent directly
    // We must set the tenant context locally so RLS policies don't throw error
    const result = await this.databaseService.getPool().connect().then(async (client) => {
      try {
        await client.query("SELECT set_config('app.current_tenant', $1, true)", [user.tenantId]);
        await client.query("SELECT set_config('app.consent_management_mode', 'true', true)");
        return await client.query(
          `SELECT consent_42cfr, consent_expires_at
           FROM protected.participants
           WHERE id = $1 AND tenant_id = $2`,
          [participantId, user.tenantId],
        );
      } finally {
        client.release();
      }
    });

    if (result.rows.length === 0) {
      return true; // Participant not found - let the controller handle 404
    }

    const participant = result.rows[0];
    if (!participant.consent_42cfr) {
      throw new ForbiddenException(
        '42 CFR Part 2 consent not granted for this participant',
      );
    }

    if (
      participant.consent_expires_at &&
      new Date(participant.consent_expires_at) < new Date()
    ) {
      throw new ForbiddenException(
        '42 CFR Part 2 consent has expired for this participant',
      );
    }

    return true;
  }
}
