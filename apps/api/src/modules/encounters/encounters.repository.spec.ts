import { Test, TestingModule } from '@nestjs/testing';
import { EncountersRepository, EncounterRow } from './encounters.repository';
import { DatabaseService } from '../../database/database.service';

describe('EncountersRepository', () => {
  let repository: EncountersRepository;
  let databaseService: DatabaseService;

  const mockEncounter: EncounterRow = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    tenant_id: '123e4567-e89b-12d3-a456-426614174001',
    participant_id: '123e4567-e89b-12d3-a456-426614174002',
    staff_id: '123e4567-e89b-12d3-a456-426614174003',
    encounter_date: '2023-01-01T10:00:00Z',
    duration_minutes: 30,
    notes: 'Test note',
    billable: true,
    service_type: 'Case Management',
    service_subcategory: 'Employment',
    partner_organization_name: null,
    location: 'Office',
    delivery_mode: 'In-person',
    format: 'Individual',
    is_completed: true,
    recovery_status: 'Active',
    recovery_stage: 'Action',
    substance_use_treatment: 'None',
    behavioral_health_treatment: 'None',
    peer_support_participation: 'None',
    housing_instability: 'No',
    food_insecurity: 'No',
    childcare_need: 'No',
    transportation_need: 'No',
    legal_support_need: 'No',
    physical_health_need: 'No',
    mental_health_need: 'No',
    trauma_informed_support: 'No',
    created_at: new Date().toISOString(),
    created_by: '123e4567-e89b-12d3-a456-426614174003',
    updated_by: '123e4567-e89b-12d3-a456-426614174003',
  };

  const mockClient = {
    query: jest.fn().mockImplementation((query) => {
      if (query.includes('COUNT(*)')) {
        return Promise.resolve({ rows: [{ total: '1' }], rowCount: 1 });
      }
      return Promise.resolve({ rows: [mockEncounter], rowCount: 1 });
    }),
  };

  const mockDatabaseService = {
    executeInTenantContext: jest.fn().mockImplementation((tenantId, userId, role, callback) => {
      return callback(mockClient);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncountersRepository,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    repository = module.get<EncountersRepository>(EncountersRepository);
    databaseService = module.get<DatabaseService>(DatabaseService);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated encounters', async () => {
      const filters = { page: 1, limit: 10 };
      const result = await repository.findAll(
        '123e4567-e89b-12d3-a456-426614174001',
        '123e4567-e89b-12d3-a456-426614174003',
        'admin',
        filters,
      );

      expect(mockClient.query).toHaveBeenCalled();
      expect(result.items).toEqual([mockEncounter]);
      expect(result.total).toBe(1);
    });
  });

  describe('create', () => {
    it('should insert a new encounter', async () => {
      const data = {
        participant_id: '123e4567-e89b-12d3-a456-426614174002',
        encounter_date: '2023-01-01T10:00:00Z',
        duration_minutes: 30,
        notes: 'Test note',
        billable: true,
        service_type: 'Case Management',
        service_subcategory: 'Employment',
        partner_organization_name: 'Org A',
        location: 'Office',
        delivery_mode: 'In-person',
        format: 'Individual',
        is_completed: true,
        recovery_status: 'Active',
        recovery_stage: 'Action',
        substance_use_treatment: 'None',
        behavioral_health_treatment: 'None',
        peer_support_participation: 'None',
        housing_instability: 'No',
        food_insecurity: 'No',
        childcare_need: 'No',
        transportation_need: 'No',
        legal_support_need: 'No',
        physical_health_need: 'No',
        mental_health_need: 'No',
        trauma_informed_support: 'No',
      };

      const result = await repository.create(
        '123e4567-e89b-12d3-a456-426614174001',
        '123e4567-e89b-12d3-a456-426614174003',
        'admin',
        data,
      );

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO protected.encounters'),
        expect.any(Array),
      );
      expect(result).toEqual(mockEncounter);
    });
  });
});
