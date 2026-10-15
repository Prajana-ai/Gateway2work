import { PoolClient } from 'pg';
import { DatabaseService } from '../../database/database.service';

export abstract class TenantAwareRepository {
  constructor(protected readonly databaseService: DatabaseService) {}

  /**
   * Execute a database operation within a tenant-scoped transaction.
   * All queries run through the provided PoolClient will have RLS
   * policies applied based on the tenant/user/role context.
   */
  protected async execute<T>(
    tenantId: string,
    userId: string,
    role: string,
    fn: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    return this.databaseService.executeInTenantContext(
      tenantId,
      userId,
      role,
      fn,
    );
  }
}
