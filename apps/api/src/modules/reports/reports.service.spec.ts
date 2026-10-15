import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { DatabaseService } from '../../database/database.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let databaseService: DatabaseService;

  const mockQueryResult = {
    rows: [
      {
        participant_id: 'participant-1',
        created_at: new Date().toISOString(),
        status: 'active',
        all_scores: [
          {
            interests: ['Technology', 'Healthcare'],
            aptitudes: [{ score: 8 }],
            barriers: [{ severity: 'low' }],
          },
        ],
      },
    ],
  };

  const mockDatabaseService = {
    executeInTenantContext: jest.fn().mockImplementation((t, u, r, cb) => cb({
      query: jest.fn().mockResolvedValue(mockQueryResult),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    databaseService = module.get<DatabaseService>(DatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getEmployabilityMetrics', () => {
    it('should calculate scores correctly', async () => {
      const metrics = await service.getEmployabilityMetrics('t1', 'u1', 'admin');
      expect(metrics).toHaveLength(1);
      const metric = metrics[0];
      expect(metric.participantId).toBe('participant-1');
      expect(metric.score).toBeGreaterThan(0);
    });
  });

  describe('getRecommendedVariables', () => {
    it('should aggregate all 15 variables correctly', async () => {
      const mockClient = {
        query: jest.fn().mockImplementation((sql: string) => {
          if (sql.includes('total_enrolled')) {
            return Promise.resolve({ rows: [{
              total_enrolled: 10, total_active: 8, total_exited: 2,
              receiving_cm: 5, receiving_training: 3, earned_credentials: 2,
              placed_employment: 4, median_wage: 15.50, retention_90: 3, retention_180: 2
            }]});
          }
          if (sql.includes('avg_days')) {
            return Promise.resolve({ rows: [{ avg_days: 45 }]});
          }
          if (sql.includes('avg_count')) {
            return Promise.resolve({ rows: [{ avg_count: 5.2 }]});
          }
          return Promise.resolve({ rows: [] }); // For top lists
        })
      };
      (mockDatabaseService.executeInTenantContext as jest.Mock).mockImplementationOnce((t, u, r, cb) => cb(mockClient));

      const result = await service.getRecommendedVariables('t1', 'u1', 'admin');
      
      expect(result.totalEnrolled).toBe(10);
      expect(result.averageTimeIntakeToPlacement).toBe(45);
      expect(result.averageServicesPerParticipant).toBe(5.2);
      expect(result.topBarriers).toEqual([]);
    });
  });
});
