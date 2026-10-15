import { Test, TestingModule } from '@nestjs/testing';
import { IpsController } from './ips.controller';
import { IpsService } from './ips.service';

describe('IpsController', () => {
  let controller: IpsController;
  let service: jest.Mocked<IpsService>;

  beforeEach(async () => {
    const mockService = {
      listReviews: jest.fn(),
      getReview: jest.fn(),
      createReview: jest.fn(),
      updateReview: jest.fn(),
      getAutomatedFidelityStats: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [IpsController],
      providers: [{ provide: IpsService, useValue: mockService }],
    }).compile();

    controller = module.get<IpsController>(IpsController);
    service = module.get(IpsService) as any;
  });

  describe('listReviews', () => {
    it('should call service.listReviews', async () => {
      const mockResult = [{ id: '1' }];
      service.listReviews.mockResolvedValue(mockResult as any);

      const result = await controller.listReviews('t1', { id: 'u1', roleName: 'admin' } as any);
      expect(result).toEqual(mockResult);
      expect(service.listReviews).toHaveBeenCalledWith('t1', 'u1', 'admin');
    });
  });

  describe('getAutomatedStats', () => {
    it('should call service.getAutomatedFidelityStats', async () => {
      const mockStats = { 
        competitiveWorkRate: 75,
        averageCaseload: 15,
        averageDaysToFirstContact: 10,
        averageWeeklyEmployerContacts: 8,
      };
      service.getAutomatedFidelityStats.mockResolvedValue(mockStats as any);

      const result = await controller.getAutomatedStats('t1', { id: 'u1', roleName: 'admin' } as any);
      expect(result).toEqual(mockStats);
      expect(service.getAutomatedFidelityStats).toHaveBeenCalledWith('t1', 'u1', 'admin');
    });
  });
});
