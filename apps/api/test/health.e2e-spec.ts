import request from 'supertest';
import { createTestApp, TestApp } from './helpers/test-app';

describe('Health endpoints (e2e)', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  describe('GET /health', () => {
    it('returns 200 with ok status', async () => {
      const res = await request(testApp.httpServer).get('/health').expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('status', 'ok');
      expect(res.body.data).toHaveProperty('timestamp');
    });
  });

  describe('GET /health/db', () => {
    it('returns database connected status when DB is healthy', async () => {
      testApp.mockDb.onQuery = (sql: string) => {
        if (sql.includes('SELECT NOW()')) {
          return { rows: [{ now: new Date().toISOString() }], rowCount: 1 };
        }
        // Audit log inserts and other background queries
        return { rows: [], rowCount: 0 };
      };

      const res = await request(testApp.httpServer)
        .get('/health/db')
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('status', 'ok');
      expect(res.body.data).toHaveProperty('database');
      expect(res.body.data.database).toHaveProperty('connected', true);
      expect(res.body.data.database).toHaveProperty('serverTime');
    });

    it('returns error status when DB is down', async () => {
      testApp.mockDb.onQuery = (sql: string) => {
        if (sql.includes('SELECT NOW()')) {
          throw new Error('Connection refused');
        }
        return { rows: [], rowCount: 0 };
      };

      const res = await request(testApp.httpServer)
        .get('/health/db')
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('status', 'error');
      expect(res.body.data.database).toHaveProperty('connected', false);
      expect(res.body.data.database).toHaveProperty('error');
    });
  });

  afterEach(() => {
    testApp.mockDb.onQuery = null;
    testApp.mockDb.mockQueryResult = { rows: [], rowCount: 0 };
  });
});
