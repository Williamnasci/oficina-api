import { GetAverageExecutionTimeUseCase } from '../../../../../../src/modules/service-orders/application/use-cases/get-average-execution-time.use-case';

describe('GetAverageExecutionTimeUseCase', () => {
  let useCase: GetAverageExecutionTimeUseCase;
  let serviceOrderRepo: any;

  beforeEach(() => {
    serviceOrderRepo = {
      getAverageExecutionTimeInMinutes: jest.fn(),
    };
    useCase = new GetAverageExecutionTimeUseCase(serviceOrderRepo);
  });

  it('should return average execution time with formatted value', async () => {
    serviceOrderRepo.getAverageExecutionTimeInMinutes.mockResolvedValue(185);

    const result = await useCase.execute();

    expect(result).toEqual({
      averageExecutionTimeInMinutes: 185,
      averageExecutionTimeFormatted: '3h 5m',
    });
  });

  it('should return zero when there are no finished service orders', async () => {
    serviceOrderRepo.getAverageExecutionTimeInMinutes.mockResolvedValue(0);

    const result = await useCase.execute();

    expect(result).toEqual({
      averageExecutionTimeInMinutes: 0,
      averageExecutionTimeFormatted: '0h 0m',
    });
  });
});
