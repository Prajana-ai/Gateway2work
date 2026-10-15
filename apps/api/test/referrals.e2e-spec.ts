import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { createTestApp, TestApp } from './helpers/test-app';
import { createMockReferral } from './helpers/mock-data';

describe('Referrals endpoints (e2e)', () => {
  let testApp: TestApp;
  let authToken: string;

  const tenantId = uuidv4();
  const userId = uuidv4();
  const roleId = uuidv4();

  beforeAll(async () => {
    testApp = await createTestApp();
    authToken = testApp.getAuthToken(userId, tenantId, 'case_manager', {
      mfa: true,
      zones: ['protected', 'application'],
      roleId,
    });
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  afterEach(() => {
    testApp.mockDb.onQuery = null;
    testApp.mockDb.mockQueryResult = { rows: [], rowCount: 0 };
  });

  describe('GET /referrals', () => {
    it('returns a paginated list of referrals', async () => {
      const referral1 = createMockReferral({ tenant_id: tenantId });
      const referral2 = createMockReferral({ tenant_id: tenantId });

      testApp.mockDb.onQuery = (sql: string) => {
        // The repository calls executeInTenantContext which uses the mock PoolClient.
        // The mock PoolClient delegates to mockDb.query, so we intercept here.
        if (sql.includes('COUNT(*)')) {
          return { rows: [{ total: '2' }], rowCount: 1 };
        }
        if (sql.includes('FROM protected.referrals')) {
          return { rows: [referral1, referral2], rowCount: 2 };
        }
        // Consent guard query
        if (sql.includes('consent_42cfr')) {
          return { rows: [{ consent_42cfr: true, consent_expires_at: null }], rowCount: 1 };
        }
        // Audit log, field permissions, etc.
        if (sql.includes('audit_logs') || sql.includes('role_field_permissions')) {
          return { rows: [], rowCount: 0 };
        }
        return { rows: [], rowCount: 0 };
      };

      const res = await request(testApp.httpServer)
        .get('/referrals')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      // The service returns { items, total }. The envelope interceptor wraps
      // this as { data: { items: [...], total }, meta: null, error: null }
      // because the result does not match the { items, pagination } pattern.
      expect(res.body.data).toHaveProperty('items');
      expect(res.body.data).toHaveProperty('total', 2);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.items).toHaveLength(2);
      expect(res.body.data.items[0]).toHaveProperty('id');
      expect(res.body.data.items[0]).toHaveProperty('referral_status');
    });

    it('returns 401 without auth token', async () => {
      await request(testApp.httpServer).get('/referrals').expect(401);
    });

    it('respects status filter query parameter', async () => {
      const completedReferral = createMockReferral({
        tenant_id: tenantId,
        referral_status: 'completed',
      });

      testApp.mockDb.onQuery = (sql: string) => {
        if (sql.includes('COUNT(*)')) {
          return { rows: [{ total: '1' }], rowCount: 1 };
        }
        if (sql.includes('FROM protected.referrals')) {
          return { rows: [completedReferral], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      };

      const res = await request(testApp.httpServer)
        .get('/referrals?status=completed')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
    });
  });

  describe('GET /referrals/:id', () => {
    it('returns referral detail with client info', async () => {
      const referralId = uuidv4();
      const referral = {
        ...createMockReferral({ id: referralId, tenant_id: tenantId }),
        participant_first_name: 'John',
        participant_last_name: 'Doe',
        participant_date_of_birth: '1990-05-20',
        participant_gender: 'male',
      };

      testApp.mockDb.onQuery = (sql: string) => {
        // Consent guard
        if (sql.includes('consent_42cfr')) {
          return {
            rows: [{ consent_42cfr: true, consent_expires_at: null }],
            rowCount: 1,
          };
        }
        if (sql.includes('FROM protected.referrals')) {
          return { rows: [referral], rowCount: 1 };
        }
        // Audit/field permissions
        return { rows: [], rowCount: 0 };
      };

      const res = await request(testApp.httpServer)
        .get(`/referrals/${referralId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('id', referralId);
      expect(res.body.data).toHaveProperty('participant_first_name', 'John');
      expect(res.body.data).toHaveProperty('referral_status');
    });

    it('returns 400 for an invalid UUID', async () => {
      await request(testApp.httpServer)
        .get('/referrals/not-a-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('POST /referrals', () => {
    it('creates a referral and returns 201', async () => {
      const participantId = uuidv4();
      const providerAgencyId = uuidv4();
      const createdReferral = createMockReferral({
        tenant_id: tenantId,
        participant_id: participantId,
        provider_agency_id: providerAgencyId,
        referral_status: 'pending',
      });

      testApp.mockDb.onQuery = (sql: string) => {
        // Participant existence check (executeInTenantContext -> PoolClient.query)
        if (sql.includes('SELECT id FROM protected.participants')) {
          return { rows: [{ id: participantId }], rowCount: 1 };
        }
        // Insert referral
        if (sql.includes('INSERT INTO protected.referrals')) {
          return { rows: [createdReferral], rowCount: 1 };
        }
        // Audit/field permissions
        return { rows: [], rowCount: 0 };
      };

      const res = await request(testApp.httpServer)
        .post('/referrals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          participant_id: participantId,
          provider_agency_id: providerAgencyId,
          notes: 'New referral',
        })
        .expect(201);

      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('participant_id', participantId);
      expect(res.body.data).toHaveProperty('referral_status', 'pending');
    });

    it('creates a participant and referral when only demographics provided', async () => {
      const participantId = uuidv4();
      const createdReferral = createMockReferral({
        tenant_id: tenantId,
        participant_id: participantId,
        referral_status: 'pending',
      });

      testApp.mockDb.onQuery = (sql: string) => {
        // EHR check
        if (sql.includes('external_ehr_id = $1')) {
          return { rows: [], rowCount: 0 };
        }
        // Fuzzy match
        if (sql.includes('similarity')) {
          return { rows: [], rowCount: 0 };
        }
        // Insert participant
        if (sql.includes('INSERT INTO protected.participants')) {
          return { rows: [{ id: participantId }], rowCount: 1 };
        }
        // Insert referral
        if (sql.includes('INSERT INTO protected.referrals')) {
          return { rows: [createdReferral], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      };

      const res = await request(testApp.httpServer)
        .post('/referrals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Jane',
          lastName: 'Smith',
          dateOfBirth: '1985-10-10',
          provider_agency_name: 'Test Agency',
        })
        .expect(201);

      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('participant_id', participantId);
    });
  });

  describe('PATCH /referrals/:id/status', () => {
    it('updates referral status', async () => {
      const referralId = uuidv4();
      const existingReferral = {
        ...createMockReferral({ id: referralId, tenant_id: tenantId }),
        participant_first_name: 'John',
        participant_last_name: 'Doe',
        participant_date_of_birth: '1990-05-20',
        participant_gender: 'male',
      };
      const updatedReferral = createMockReferral({
        id: referralId,
        tenant_id: tenantId,
        referral_status: 'completed',
      });

      let findByIdCallCount = 0;
      testApp.mockDb.onQuery = (sql: string) => {
        // Consent guard
        if (sql.includes('consent_42cfr')) {
          return {
            rows: [{ consent_42cfr: true, consent_expires_at: null }],
            rowCount: 1,
          };
        }
        // findById (verification that referral exists)
        if (sql.includes('FROM protected.referrals') && sql.includes('LEFT JOIN')) {
          findByIdCallCount++;
          return { rows: [existingReferral], rowCount: 1 };
        }
        // updateStatus
        if (sql.includes('UPDATE protected.referrals')) {
          return { rows: [updatedReferral], rowCount: 1 };
        }
        // Audit/field permissions
        return { rows: [], rowCount: 0 };
      };

      const res = await request(testApp.httpServer)
        .patch(`/referrals/${referralId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'completed' })
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('referral_status', 'completed');
    });
  });
});
