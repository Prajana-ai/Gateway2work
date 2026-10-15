import { PoolConfig } from 'pg';

export function getDatabaseConfig(password?: string): PoolConfig {
  const requireSsl = process.env.DATABASE_SSL !== 'false' && process.env.NODE_ENV !== 'development';

  return {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    user: process.env.DATABASE_USER || 'postgres',
    password: password || process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'impactforge',
    max: parseInt(process.env.DATABASE_POOL_MAX || '20', 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ...(requireSsl
      ? {
          ssl: {
            rejectUnauthorized: process.env.NODE_ENV === 'production',
          },
        }
      : {}),
  };
}
