import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { DatabaseService } from '../../database/database.service';
import { DATA_ZONE_KEY } from '../decorators/data-zone.decorator';

const NIL_UUID = '00000000-0000-0000-0000-000000000000';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly db: DatabaseService,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    const dataZone = this.reflector.getAllAndOverride<string>(DATA_ZONE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (dataZone !== 'protected') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantId = user?.tenantId;
    const userId = user?.id;

    if (!tenantId || !userId) {
      return next.handle();
    }

    const action = request.method === 'POST' ? 'INSERT' : request.method === 'PATCH' ? 'UPDATE' : request.method === 'DELETE' ? 'DELETE' : 'INSERT';
    const tableName = 'api.' + request.url;
    const recordId =
      request.params?.id || request.params?.participantId || NIL_UUID;

    return next.handle().pipe(
      tap(() => {
        this.writeAuditLog(tenantId, tableName, recordId, action, userId).catch(
          (err) => this.logger.error('Failed to write audit log', err),
        );
      }),
      catchError((error) => {
        this.writeAuditLog(
          tenantId,
          tableName,
          recordId,
          action,
          userId,
        ).catch((err) =>
          this.logger.error('Failed to write audit log on error', err),
        );
        throw error;
      }),
    );
  }

  private async writeAuditLog(
    tenantId: string,
    tableName: string,
    recordId: string,
    action: string,
    performedBy: string,
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO protected.audit_logs
        (tenant_id, table_name, record_id, action, old_values, new_values, performed_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [tenantId, tableName, recordId, action, null, null, performedBy],
    );
  }
}
