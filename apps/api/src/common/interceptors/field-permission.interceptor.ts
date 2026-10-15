import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { DatabaseService } from '../../database/database.service';
import { RESOURCE_KEY } from '../decorators/resource.decorator';

interface CacheEntry {
  fields: string[];
  expiresAt: number;
}

const CACHE_TTL_MS = 60_000;

@Injectable()
export class FieldPermissionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(FieldPermissionInterceptor.name);
  private readonly cache = new Map<string, CacheEntry>();

  constructor(
    private readonly reflector: Reflector,
    private readonly db: DatabaseService,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    const resource = this.reflector.getAllAndOverride<string>(RESOURCE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!resource) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const roleId = request.user?.roleId;

    if (!roleId) {
      return next.handle();
    }

    return next.handle().pipe(
      switchMap((data) =>
        from(
          this.getAllowedFields(roleId, resource).then((allowedFields) => {
            if (allowedFields === null) {
              return data;
            }

            if (Array.isArray(data)) {
              return data.map((item) => this.filterFields(item, allowedFields));
            }

            return this.filterFields(data, allowedFields);
          }),
        ),
      ),
    );
  }

  /**
   * Returns the list of allowed fields for a role+resource,
   * or null if no restrictions are configured (allow all).
   */
  private async getAllowedFields(
    roleId: string,
    resource: string,
  ): Promise<string[] | null> {
    const cacheKey = `${roleId}:${resource}`;
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.fields.length > 0 ? cached.fields : null;
    }

    try {
      const result = await this.db.query<{ field_name: string }>(
        `SELECT field_name FROM role_field_permissions
         WHERE role_id = $1 AND resource = $2`,
        [roleId, resource],
      );

      if (result.rows.length === 0) {
        this.cache.set(cacheKey, { fields: [], expiresAt: Date.now() + CACHE_TTL_MS });
        return null;
      }

      const fields = result.rows.map((row) => row.field_name);
      this.cache.set(cacheKey, { fields, expiresAt: Date.now() + CACHE_TTL_MS });
      return fields;
    } catch (err) {
      this.logger.error(
        `Failed to query field permissions for role=${roleId} resource=${resource}`,
        err,
      );
      return null;
    }
  }

  private filterFields(
    obj: Record<string, any>,
    allowedFields: string[],
  ): Record<string, any> {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const filtered: Record<string, any> = {};
    for (const field of allowedFields) {
      if (field in obj) {
        filtered[field] = obj[field];
      }
    }
    return filtered;
  }
}
