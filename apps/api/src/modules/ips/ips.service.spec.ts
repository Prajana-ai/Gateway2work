import { Test, TestingModule } from '@nestjs/testing';
import { IpsService } from './ips.service';
import { IpsRepository } from './ips.repository';
import { NotFoundException } from '@nestjs/common';

describe('IpsService', () => {
  let service: IpsService;
  let repository: jest.Mocked<IpsRepository>;

  beforeEach(async () => {
    const mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      getAutomatedFidelityStats: jest.fn(),
      getStaffIdByUserId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IpsService,
        { provide: IpsRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<IpsService>(IpsService);
    repository = module.get(IpsRepository) as any;
  });

  describe('listReviews', () => {
    it('should return all reviews for a tenant', async () => {
      const mockReviews = [{ id: '1', total_score: 100 }];
      repository.findAll.mockResolvedValue(mockReviews);

      const result = await service.listReviews('t1', 'u1', 'admin');
      expect(result).toEqual(mockReviews);
      expect(repository.findAll).toHaveBeenCalledWith('t1', 'u1', 'admin');
    });
  });

  describe('getReview', () => {
    it('should return a specific review', async () => {
      const mockReview = { id: '1', total_score: 100 };
      repository.findById.mockResolvedValue(mockReview);

      const result = await service.getReview('t1', 'u1', 'admin', '1');
      expect(result).toEqual(mockReview);
    });

    it('should throw NotFoundException if review missing', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.getReview('t1', 'u1', 'admin', '2')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createReview', () => {
    it('should create a new review', async () => {
      const data = { total_score: 100 };
      const mockStaffId = 'staff-123';
      repository.getStaffIdByUserId.mockResolvedValue(mockStaffId);
      repository.create.mockResolvedValue({ id: 'new', reviewer_id: mockStaffId, ...data });

      const result = await service.createReview('t1', 'u1', 'admin', data);
      expect(result.id).toBe('new');
      expect(repository.getStaffIdByUserId).toHaveBeenCalledWith('t1', 'u1', 'admin');
      expect(repository.create).toHaveBeenCalledWith('t1', 'u1', 'admin', {
        ...data,
        reviewer_id: mockStaffId,
      });
    });
  });

  describe('getAutomatedFidelityStats', () => {
    it('should return automated stats from repository', async () => {
      const mockStats = { 
        competitiveWorkRate: 50,
        averageCaseload: 20,
        averageDaysToFirstContact: 15,
        averageWeeklyEmployerContacts: 6,
      };
      repository.getAutomatedFidelityStats.mockResolvedValue(mockStats);

      const result = await service.getAutomatedFidelityStats('t1', 'u1', 'admin');
      expect(result).toEqual(mockStats);
    });
  });
});
