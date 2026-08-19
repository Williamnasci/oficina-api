import { StartServiceOrderExecutionUseCase } from '../../../../../../src/modules/service-orders/application/use-cases/start-service-order-execution.use-case';
import { ServiceOrderRepository } from '../../../../../../src/modules/service-orders/domain/repositories/service-order.repository';

describe('StartServiceOrderExecutionUseCase', () => {
  let useCase: StartServiceOrderExecutionUseCase;
  let repository: jest.Mocked<ServiceOrderRepository>;
  let mockServiceOrder: any;

  beforeEach(() => {
    mockServiceOrder = {
      startExecution: jest.fn(),
    };
    repository = {
      findById: jest.fn().mockResolvedValue(mockServiceOrder),
      update: jest.fn(),
    } as any;
    useCase = new StartServiceOrderExecutionUseCase(repository);
  });

  it('should start execution', async () => {
    await useCase.execute('order-1');
    expect(repository.findById).toHaveBeenCalledWith('order-1');
    expect(mockServiceOrder.startExecution).toHaveBeenCalled();
    expect(repository.update).toHaveBeenCalledWith(mockServiceOrder);
  });
});
