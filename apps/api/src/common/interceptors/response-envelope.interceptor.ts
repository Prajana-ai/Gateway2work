import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface EnvelopedResponse<T> {
  data: T;
  meta: Record<string, any> | null;
  error: null;
}

@Injectable()
export class ResponseEnvelopeInterceptor<T>
  implements NestInterceptor<T, EnvelopedResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<EnvelopedResponse<T>> {
    return next.handle().pipe(
      map((result) => {
        // If the result is already enveloped (e.g. from health check), pass through
        if (
          result &&
          typeof result === 'object' &&
          'data' in (result as any) &&
          'error' in (result as any)
        ) {
          return result as any;
        }

        let meta: Record<string, any> | null = null;

        // For arrays, include count. If pagination metadata is attached, include it.
        if (Array.isArray(result)) {
          meta = { count: result.length };
        }

        // Support pagination metadata passed via a wrapper object
        if (
          result &&
          typeof result === 'object' &&
          'items' in (result as any) &&
          'pagination' in (result as any)
        ) {
          const paginated = result as any;
          return {
            data: paginated.items,
            meta: paginated.pagination,
            error: null,
          };
        }

        return {
          data: result,
          meta,
          error: null,
        };
      }),
    );
  }
}
