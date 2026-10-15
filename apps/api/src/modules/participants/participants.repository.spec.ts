import { Test, TestingModule } from '@nestjs/testing';
import { ParticipantsRepository } from './participants.repository';
import { DatabaseService } from '../../database/database.service';

describe('ParticipantsRepository', () => {
  let repository: ParticipantsRepository;
  let mockDatabaseService: any;
  let mockDbClient: any;

  beforeEach(async () => {
    mockDbClient = {
      query: jest.fn(),
    };

    mockDatabaseService = {
      executeInTenantContext: jest.fn((tenantId, userId, role, callback) =>
        callback(mockDbClient),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParticipantsRepository,
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();

    repository = module.get<ParticipantsRepository>(ParticipantsRepository);
  });

  it('should create a participant and automatically create a public.users login account when email is provided', async () => {
    const mockTenantId = 'tenant-123';
    const mockUserId = 'staff-456';
    const mockRole = 'workforce_specialist';
    const mockParticipantId = 'part-789';
    const mockRoleId = 'role-participant';

    // Mock query calls in order:
    // 1. set_config
    // 2. protected.participants insert
    // 3. public.roles select
    // 4. public.users insert/update
    mockDbClient.query
      .mockResolvedValueOnce({ rows: [] }) // set_config
      .mockResolvedValueOnce({
        rows: [
          {
            id: mockParticipantId,
            tenant_id: mockTenantId,
            demographics: {
              first_name: 'John',
              last_name: 'Doe',
              email: 'john.doe@example.com',
            },
          },
        ],
      }) // participants insert
      .mockResolvedValueOnce({ rows: [{ id: mockRoleId }] }) // roles select
      .mockResolvedValueOnce({ rows: [{ id: mockParticipantId }] }); // users insert

    const result = await repository.create(mockTenantId, mockUserId, mockRole, {
      demographics: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
      },
    });

    expect(result.id).toBe(mockParticipantId);
    expect(mockDbClient.query).toHaveBeenCalledWith(
      "SELECT set_config('app.consent_management_mode', 'true', true)",
    );

    // Verify user login account insertion call
    const userInsertCall = mockDbClient.query.mock.calls.find((call: any[]) =>
      call[0].includes('INSERT INTO public.users'),
    );
    expect(userInsertCall).toBeDefined();
    expect(userInsertCall[1][0]).toBe(mockParticipantId); // id
    expect(userInsertCall[1][1]).toBe(mockTenantId); // tenant_id
    expect(userInsertCall[1][2]).toBe('john.doe@example.com'); // email
    expect(userInsertCall[1][4]).toBe(mockRoleId); // role_id
    expect(userInsertCall[1][5]).toBe('John'); // first_name
    expect(userInsertCall[1][6]).toBe('Doe'); // last_name
  });

  it('should provision login credentials for an existing participant', async () => {
    const mockTenantId = 'tenant-123';
    const mockUserId = 'staff-456';
    const mockRole = 'workforce_specialist';
    const mockParticipantId = 'part-789';
    const mockRoleId = 'role-participant';

    mockDbClient.query
      .mockResolvedValueOnce({ rows: [] }) // set_config
      .mockResolvedValueOnce({
        rows: [
          {
            id: mockParticipantId,
            tenant_id: mockTenantId,
            demographics: {
              first_name: 'Jane',
              last_name: 'Smith',
              email: 'jane.smith@example.com',
            },
          },
        ],
      }) // participants select
      .mockResolvedValueOnce({ rows: [{ id: mockRoleId }] }) // roles select
      .mockResolvedValueOnce({ rows: [{ id: mockParticipantId }] }); // users insert/update

    const result = await repository.provisionLogin(
      mockTenantId,
      mockUserId,
      mockRole,
      mockParticipantId,
    );

    expect(result.success).toBe(true);
    expect(result.email).toBe('jane.smith@example.com');
    expect(result.temporaryPassword).toBe('changeme123');
  });
});
