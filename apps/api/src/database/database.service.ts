import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Pool, PoolClient, QueryResult } from 'pg';
import { getDatabaseConfig } from '../config/database.config';
import { SecretsService } from '../common/secrets/secrets.service';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool!: Pool;
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private readonly secretsService: SecretsService) {}

  async onModuleInit() {
    let password = process.env.DATABASE_PASSWORD;
    if (process.env.AZURE_KEYVAULT_NAME) {
      try {
        password = await this.secretsService.getSecret('DATABASE_PASSWORD');
        this.logger.log('Database password retrieved from Azure Key Vault');
      } catch (error) {
        this.logger.error('Failed to retrieve database password from Key Vault', error);
        throw error;
      }
    }
    this.pool = new Pool(getDatabaseConfig(password));
  }

  getPool(): Pool {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }
    return this.pool;
  }

  async query<T extends Record<string, any> = any>(
    text: string,
    params?: any[],
  ): Promise<QueryResult<T>> {
    return this.getPool().query<T>(text, params);
  }

  /**
   * Execute a callback within a tenant-scoped transaction.
   */
  async executeInTenantContext<T>(
    tenantId: string,
    userId: string,
    role: string,
    fn: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.getPool().connect();
    try {
      await client.query('BEGIN');

      await client.query(
        "SELECT set_config('app.current_tenant', $1, true)",
        [tenantId],
      );
      await client.query(
        "SELECT set_config('app.current_user_id', $1, true)",
        [userId],
      );
      await client.query(
        "SELECT set_config('app.current_role', $1, true)",
        [role],
      );

      const result = await fn(client);

      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
    }
  }
}
