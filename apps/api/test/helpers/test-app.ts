import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from 'src/app.module';
import { DatabaseService } from 'src/database/database.service';

/**
 * A mock PoolClient that records queries for assertion and returns
 * configurable results via the parent MockDatabaseService.
 */
function createMockPoolClient(mockDb: MockDatabaseService) {
  return {
    query: jest.fn().mockImplementation((sql: string, params?: any[]) => {
      return mockDb.query(sql, params);
    }),
    release: jest.fn(),
  };
}

/**
 * Mock DatabaseService that replaces the real PostgreSQL-backed service.
 *
 * - `query()` returns whatever is set via `mockQueryResult` or the
 *   function passed to `onQuery`.
 * - `executeInTenantContext()` invokes the callback with a mock PoolClient
 *   so repositories work without a real database.
 */
export class MockDatabaseService {
  /** Default result returned by query() and the mock PoolClient */
  public mockQueryResult: { rows: any[]; rowCount: number } = {
    rows: [],
    rowCount: 0,
  };

  /**
   * Optional handler: if set, query() delegates to this function.
   * Useful when a single test requires different results for different SQL.
   */
  public onQuery: ((sql: string, params?: any[]) => any) | null = null;

  async query(sql: string, params?: any[]): Promise<any> {
    if (this.onQuery) {
      return this.onQuery(sql, params);
    }
    return this.mockQueryResult;
  }

  async executeInTenantContext<T>(
    _tenantId: string,
    _userId: string,
    _role: string,
    fn: (client: any) => Promise<T>,
  ): Promise<T> {
    const poolClient = createMockPoolClient(this);
    return fn(poolClient);
  }

  getPool() {
    return {
      query: (sql: string, params?: any[]) => this.query(sql, params),
      connect: jest.fn().mockResolvedValue(createMockPoolClient(this)),
      end: jest.fn(),
    };
  }

  async onModuleDestroy() {
    // no-op
  }
}

export interface TestApp {
  app: INestApplication;
  httpServer: any;
  mockDb: MockDatabaseService;
  jwtService: JwtService;
  getAuthToken: (
    userId: string,
    tenantId: string,
    role: string,
    options?: { mfa?: boolean; zones?: string[]; roleId?: string },
  ) => string;
}

/**
 * Bootstrap a real NestJS application with the DatabaseService replaced by
 * a mock. Returns everything needed to drive E2E tests via supertest.
 */
export async function createTestApp(): Promise<TestApp> {
  const mockDb = new MockDatabaseService();

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(DatabaseService)
    .useValue(mockDb)
    .compile();

  const app = moduleFixture.createNestApplication();
  await app.init();

  const jwtService = moduleFixture.get<JwtService>(JwtService);

  const getAuthToken = (
    userId: string,
    tenantId: string,
    role: string,
    options: { mfa?: boolean; zones?: string[]; roleId?: string } = {},
  ): string => {
    const payload = {
      sub: userId,
      tid: tenantId,
      rid: options.roleId || 'role-id-placeholder',
      rname: role,
      zones: options.zones || ['protected', 'application'],
      mfa: options.mfa ?? true,
    };
    return jwtService.sign(payload, { expiresIn: '15m' });
  };

  return {
    app,
    httpServer: app.getHttpServer(),
    mockDb,
    jwtService,
    getAuthToken,
  };
}
