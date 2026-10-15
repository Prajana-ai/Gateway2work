import { Test, TestingModule } from '@nestjs/testing';
import { TrainingsRepository } from './trainings.repository';
import { DatabaseService } from '../../database/database.service';
import { CreateTrainingDto } from '@impactforge/shared';

describe('TrainingsRepository', () => {
  let repository: TrainingsRepository;
  let databaseService: DatabaseService;

  const mockTrainingRecord = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    tenant_id: '123e4567-e89b-12d3-a456-426614174001',
    participant_id: '123e4567-e89b-12d3-a456-426614174002',
    program_name: 'Test Program',
    provider: 'Test Provider',
    start_date: '2023-01-01',
    end_date: '2023-06-01',
    is_completed: true,
    completion_date: '2023-06-01',
    credential_earned: 'Cert A',
    credential_type: 'Certificate',
    license_earned: null,
    apprenticeship_participation: false,
    internship_participation: true,
    wbl_participation: false,
    ojt_participation: false,
    total_hours: 120,
    stipend_provided: true,
    outcome: 'Successful',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: '123e4567-e89b-12d3-a456-426614174003',
    updated_by: '123e4567-e89b-12d3-a456-426614174003',
  };

  const mockClient = {
    query: jest.fn().mockResolvedValue({ rows: [mockTrainingRecord], rowCount: 1 }),
  };

  const mockDatabaseService = {
    executeInTenantContext: jest.fn().mockImplementation((tenantId, userId, role, callback) => {
      return callback(mockClient);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrainingsRepository,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    repository = module.get<TrainingsRepository>(TrainingsRepository);
    databaseService = module.get<DatabaseService>(DatabaseService);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should insert a new training record', async () => {
      const data: CreateTrainingDto = {
        participant_id: '123e4567-e89b-12d3-a456-426614174002',
        program_name: 'Test Program',
        provider: 'Test Provider',
        start_date: '2023-01-01',
        end_date: '2023-06-01',
        is_completed: true,
        completion_date: '2023-06-01',
        credential_earned: 'Cert A',
        credential_type: 'Certificate',
        license_earned: null,
        apprenticeship_participation: false,
        internship_participation: true,
        wbl_participation: false,
        ojt_participation: false,
        total_hours: 120,
        stipend_provided: true,
        outcome: 'Successful',
      };

      const result = await repository.create(
        '123e4567-e89b-12d3-a456-426614174001',
        '123e4567-e89b-12d3-a456-426614174003',
        'admin',
        data,
      );

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO protected.trainings'),
        expect.any(Array),
      );
      expect(result).toEqual(mockTrainingRecord);
    });
  });

  describe('findById', () => {
    it('should return a training record by id', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const result = await repository.findById(
        '123e4567-e89b-12d3-a456-426614174001',
        '123e4567-e89b-12d3-a456-426614174003',
        'admin',
        id,
      );

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM protected.trainings WHERE id = $1'),
        [id, '123e4567-e89b-12d3-a456-426614174001'],
      );
      expect(result).toEqual(mockTrainingRecord);
    });
  });
});
