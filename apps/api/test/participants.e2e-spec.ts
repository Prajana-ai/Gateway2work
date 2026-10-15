import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { createTestApp, TestApp } from './helpers/test-app';
import { createMockParticipant } from './helpers/mock-data';

describe('Participants endpoints (e2e)', () => {
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

  describe('GET /participants', () => {
    it('returns a paginated list of participants', async () => {
      const participant1 = { ...createMockParticipant({ tenant_id: tenantId }), total_count: '2' };
      const participant2 = { ...createMockParticipant({ tenant_id: tenantId }), total_count: '2' };

      testApp.mockDb.onQuery = (sql: string) => {
        // The participants repository uses executeInTenantContext -> mock PoolClient -> mockDb.query
        if (sql.includes('FROM protected.participants') && sql.includes('COUNT(*) OVER() AS total_count')) {
          return { rows: [participant1, participant2], rowCount: 2 };
        }
        // Audit/field permissions
        return { rows: [], rowCount: 0 };
      };

      const res = await request(testApp.httpServer)
        .get('/participants')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      // The participants service returns PaginatedClients { data, total, page, limit }.
      // The envelope interceptor wraps it as { data: { data: [...], total, page, limit }, ... }.
      expect(res.body.data).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('total');
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data.data).toHaveLength(2);
      expect(res.body.data.data[0]).toHaveProperty('id');
      expect(res.body.data.data[0]).toHaveProperty('demographics');
      // total_count should be stripped by the repository
      expect(res.body.data.data[0]).not.toHaveProperty('total_count');
    });

    it('returns 401 without auth token', async () => {
      await request(testApp.httpServer).get('/participants').expect(401);
    });

    it('passes search parameter through to the query', async () => {
      const johnClient = {
        ...createMockParticipant({
          tenant_id: tenantId,
          demographics: {
            first_name: 'John',
            last_name: 'Smith',
            date_of_birth: '1985-03-10',
          },
        }),
        total_count: '1',
      };

      testApp.mockDb.onQuery = (sql: string) => {
        if (sql.includes('FROM protected.participants')) {
          return { rows: [johnClient], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      };

      const res = await request(testApp.httpServer)
        .get('/participants?search=john')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('data');
      expect(res.body.data.data).toHaveLength(1);
    });

    it('supports pagination parameters', async () => {
      testApp.mockDb.onQuery = (sql: string) => {
        if (sql.includes('FROM protected.participants')) {
          return { rows: [], rowCount: 0 };
        }
        return { rows: [], rowCount: 0 };
      };

      const res = await request(testApp.httpServer)
        .get('/participants?page=2&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
    });
  });

  describe('GET /participants/:id', () => {
    it('returns participant detail', async () => {
      const participantId = uuidv4();
      const mockClient = createMockParticipant({ id: participantId, tenant_id: tenantId });

      testApp.mockDb.onQuery = (sql: string) => {
        // Consent guard
        if (sql.includes('consent_42cfr') && sql.includes('tenant_id')) {
          return {
            rows: [{ consent_42cfr: true, consent_expires_at: null }],
            rowCount: 1,
          };
        }
        if (sql.includes('FROM protected.participants WHERE id')) {
          return { rows: [mockClient], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      };

      const res = await request(testApp.httpServer)
        .get(`/participants/${participantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('id', participantId);
      expect(res.body.data).toHaveProperty('demographics');
      expect(res.body.data).toHaveProperty('consent_42cfr', true);
    });

    it('returns 400 for an invalid UUID', async () => {
      await request(testApp.httpServer)
        .get('/participants/not-a-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('GET /participants/:id/360', () => {
    it('returns 360-degree view for a participant', async () => {
      const participantId = uuidv4();
      const mockClient = createMockParticipant({ id: participantId, tenant_id: tenantId });

      testApp.mockDb.onQuery = (sql: string) => {
        // Consent guard
        if (sql.includes('consent_42cfr') && sql.includes('tenant_id')) {
          return {
            rows: [{ consent_42cfr: true, consent_expires_at: null }],
            rowCount: 1,
          };
        }
        // Client record
        if (sql.includes('FROM protected.participants') && sql.includes('COALESCE(e.referral_source')) {
          return { rows: [mockClient], rowCount: 1 };
        }
        // Referrals
        if (sql.includes('FROM protected.referrals')) {
          return {
            rows: [
              { id: uuidv4(), referral_status: 'completed', participant_id: participantId },
            ],
            rowCount: 1,
          };
        }
        // Assessments
        if (sql.includes('FROM protected.assessments')) {
          return { rows: [], rowCount: 0 };
        }
        // Workforce plans
        if (sql.includes('FROM application.workforce_plans')) {
          return { rows: [], rowCount: 0 };
        }
        // Encounters
        if (sql.includes('FROM protected.encounters')) {
          return { rows: [], rowCount: 0 };
        }
        // Employer matches
        if (sql.includes('FROM application.participant_employer_matches')) {
          return { rows: [], rowCount: 0 };
        }
        return { rows: [], rowCount: 0 };
      };

      const res = await request(testApp.httpServer)
        .get(`/participants/${participantId}/360`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('participant');
      expect(res.body.data.participant).toHaveProperty('id', participantId);
      expect(res.body.data).toHaveProperty('referrals');
      expect(res.body.data).toHaveProperty('assessments');
      expect(res.body.data).toHaveProperty('workforcePlan');
      expect(res.body.data).toHaveProperty('encounters');
      expect(res.body.data).toHaveProperty('matches');
      expect(res.body.data.referrals).toHaveLength(1);
    });
  });

  describe('POST /participants', () => {
    it('creates a participant and returns 201', async () => {
      const createdClient = createMockParticipant({
        tenant_id: tenantId,
        demographics: {
          first_name: 'Jane',
          last_name: 'Smith',
          date_of_birth: '1992-08-15',
          email: 'jane.smith@example.com',
          housing_status: 'Stable',
          transit_status: 'Car',
          need_childcare: true,
          needs_drivers_license: false,
        },
      });

      testApp.mockDb.onQuery = (sql: string) => {
        // Duplicate check
        if (sql.includes('similarity')) {
          return { rows: [], rowCount: 0 };
        }
        // Insert
        if (sql.includes('INSERT INTO protected.participants')) {
          return { rows: [createdClient], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      };

      const res = await request(testApp.httpServer)
        .post('/participants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          demographics: {
            first_name: 'Jane',
            last_name: 'Smith',
            date_of_birth: '1992-08-15',
            email: 'jane.smith@example.com',
            housing_status: 'Stable',
            transit_status: 'Car',
            need_childcare: true,
            needs_drivers_license: false,
          },
          consent_42cfr: true,
          consent_expires_at: '2027-12-31',
          referral_source: 'self',
        })
        .expect(201);

      expect(res.body).toHaveProperty('data');
      expect(res.body.data.participant.demographics).toHaveProperty('housing_status', 'Stable');
      expect(res.body.data.participant.demographics).toHaveProperty('transit_status', 'Car');
      expect(res.body.data.participant.demographics).toHaveProperty('need_childcare', true);
      expect(res.body.data.participant.demographics).toHaveProperty('needs_drivers_license', false);
    });

    it('returns 400 if demographics are missing', async () => {
      await request(testApp.httpServer)
        .post('/participants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          consent_42cfr: true,
          referral_source: 'self',
        })
        .expect(400);
    });
  });

  describe('PATCH /participants/:id/consent', () => {
    it('updates consent for a participant', async () => {
      const participantId = uuidv4();
      const mockClient = createMockParticipant({
        id: participantId,
        tenant_id: tenantId,
        consent_42cfr: false,
      });
      const updatedClient = {
        ...mockClient,
        consent_42cfr: true,
        consent_expires_at: '2028-01-01T00:00:00.000Z',
      };

      testApp.mockDb.onQuery = (sql: string) => {
        // getById check (the service calls getById before update)
        if (sql.includes('FROM protected.participants WHERE id') && !sql.includes('UPDATE')) {
          return { rows: [mockClient], rowCount: 1 };
        }
        // Consent guard -- this route does NOT have @RequiresConsent so
        // the consent guard should not block. But if the guard still queries:
        if (sql.includes('consent_42cfr') && sql.includes('tenant_id') && !sql.includes('UPDATE')) {
          return { rows: [{ consent_42cfr: true, consent_expires_at: null }], rowCount: 1 };
        }
        // Update
        if (sql.includes('UPDATE protected.participants')) {
          return { rows: [updatedClient], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      };

      const res = await request(testApp.httpServer)
        .patch(`/participants/${participantId}/consent`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          consent_42cfr: true,
          consent_expires_at: '2028-01-01',
        })
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('consent_42cfr', true);
    });
  });
});
