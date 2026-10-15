import request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { createTestApp, TestApp } from './helpers/test-app';
import { createMockUser } from './helpers/mock-data';

describe('Auth endpoints (e2e)', () => {
  let testApp: TestApp;

  const PASSWORD = 'Password123!';
  let passwordHash: string;
  let mockUser: ReturnType<typeof createMockUser>;

  beforeAll(async () => {
    passwordHash = await bcrypt.hash(PASSWORD, 10);
    mockUser = createMockUser({
      password_hash: passwordHash,
      is_active: true,
      mfa_enabled: false,
    });
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  afterEach(() => {
    testApp.mockDb.onQuery = null;
    testApp.mockDb.mockQueryResult = { rows: [], rowCount: 0 };
  });

  describe('POST /auth/login', () => {
    it('returns tokens on successful login (no MFA)', async () => {
      testApp.mockDb.onQuery = (sql: string) => {
        if (sql.includes('FROM public.users')) {
          return { rows: [mockUser], rowCount: 1 };
        }
        if (sql.includes('UPDATE public.users SET last_login_at')) {
          return { rows: [], rowCount: 1 };
        }
        // getUserZones
        if (sql.includes('role_permissions')) {
          return {
            rows: [{ data_zone: 'both' }],
            rowCount: 1,
          };
        }
        // Insert refresh token
        if (sql.includes('INSERT INTO public.refresh_tokens')) {
          return { rows: [], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      };

      const res = await request(testApp.httpServer)
        .post('/auth/login')
        .send({ email: mockUser.email, password: PASSWORD })
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('requiresMfa', false);
      expect(res.body.data).toHaveProperty('tokens');
      expect(res.body.data.tokens).toHaveProperty('accessToken');
      expect(res.body.data.tokens).toHaveProperty('refreshToken');
    });

    it('returns 401 for wrong password', async () => {
      testApp.mockDb.onQuery = (sql: string) => {
        if (sql.includes('FROM public.users')) {
          return { rows: [mockUser], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      };

      const res = await request(testApp.httpServer)
        .post('/auth/login')
        .send({ email: mockUser.email, password: 'WrongPassword!' })
        .expect(401);

      expect(res.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('returns 401 when user not found', async () => {
      testApp.mockDb.mockQueryResult = { rows: [], rowCount: 0 };

      const res = await request(testApp.httpServer)
        .post('/auth/login')
        .send({ email: 'nobody@example.com', password: PASSWORD })
        .expect(401);

      expect(res.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('returns mfaRequired when MFA is enabled', async () => {
      const mfaUser = createMockUser({
        password_hash: passwordHash,
        is_active: true,
        mfa_enabled: true,
        mfa_secret: 'JBSWY3DPEHPK3PXP',
      });

      testApp.mockDb.onQuery = (sql: string) => {
        if (sql.includes('FROM public.users')) {
          return { rows: [mfaUser], rowCount: 1 };
        }
        if (sql.includes('UPDATE public.users SET last_login_at')) {
          return { rows: [], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      };

      const res = await request(testApp.httpServer)
        .post('/auth/login')
        .send({ email: mfaUser.email, password: PASSWORD })
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('requiresMfa', true);
      expect(res.body.data).toHaveProperty('mfaSessionToken');
      expect(res.body.data.tokens).toBeUndefined();
    });

    it('returns 401 for deactivated user', async () => {
      const inactiveUser = createMockUser({
        password_hash: passwordHash,
        is_active: false,
      });

      testApp.mockDb.onQuery = (sql: string) => {
        if (sql.includes('FROM public.users')) {
          return { rows: [inactiveUser], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      };

      const res = await request(testApp.httpServer)
        .post('/auth/login')
        .send({ email: inactiveUser.email, password: PASSWORD })
        .expect(401);

      expect(res.body).toHaveProperty('message', 'Account is deactivated');
    });
  });

  describe('POST /auth/refresh', () => {
    it('returns new tokens for a valid refresh token', async () => {
      const userId = mockUser.id;
      const tenantId = mockUser.tenant_id;

      // First issue a real refresh token via the JWT service so we can verify it
      const refreshJti = uuidv4();
      const refreshToken = testApp.jwtService.sign(
        { sub: userId, tid: tenantId, jti: refreshJti, type: 'refresh' },
        { expiresIn: '24h' },
      );

      testApp.mockDb.onQuery = (sql: string) => {
        // Check refresh token hash
        if (sql.includes('FROM public.refresh_tokens')) {
          return {
            rows: [
              {
                id: uuidv4(),
                user_id: userId,
                is_revoked: false,
                used_at: null,
              },
            ],
            rowCount: 1,
          };
        }
        // Mark old token used
        if (sql.includes('UPDATE public.refresh_tokens SET used_at')) {
          return { rows: [], rowCount: 1 };
        }
        // Fetch user
        if (sql.includes('FROM public.users u')) {
          return {
            rows: [
              {
                id: userId,
                tenant_id: tenantId,
                email: mockUser.email,
                is_active: true,
                mfa_enabled: false,
                role_id: mockUser.role_id,
                role_name: mockUser.role_name,
              },
            ],
            rowCount: 1,
          };
        }
        // getUserZones
        if (sql.includes('role_permissions')) {
          return { rows: [{ data_zone: 'both' }], rowCount: 1 };
        }
        // Insert new refresh token
        if (sql.includes('INSERT INTO public.refresh_tokens')) {
          return { rows: [], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      };

      const res = await request(testApp.httpServer)
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
    });

    it('returns 401 for a revoked refresh token', async () => {
      const userId = mockUser.id;
      const tenantId = mockUser.tenant_id;

      const refreshToken = testApp.jwtService.sign(
        { sub: userId, tid: tenantId, jti: uuidv4(), type: 'refresh' },
        { expiresIn: '24h' },
      );

      testApp.mockDb.onQuery = (sql: string) => {
        if (sql.includes('FROM public.refresh_tokens')) {
          return {
            rows: [
              {
                id: uuidv4(),
                user_id: userId,
                is_revoked: true,
                used_at: null,
              },
            ],
            rowCount: 1,
          };
        }
        // Revoke all tokens for user (security measure)
        if (sql.includes('UPDATE public.refresh_tokens')) {
          return { rows: [], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      };

      const res = await request(testApp.httpServer)
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('reuse detected');
    });

    it('returns 401 for an invalid refresh token', async () => {
      const res = await request(testApp.httpServer)
        .post('/auth/refresh')
        .send({ refreshToken: 'totally-invalid-token' })
        .expect(401);

      expect(res.body).toHaveProperty('message', 'Invalid refresh token');
    });
  });

  describe('Protected route without token', () => {
    it('returns 401 when accessing a protected endpoint without Authorization header', async () => {
      const res = await request(testApp.httpServer)
        .get('/clients')
        .expect(401);

      expect(res.body).toHaveProperty('message');
    });
  });
});
