import { DeliverServiceOrderUseCase } from '../../../../../../src/modules/service-orders/application/use-cases/deliver-service-order.use-case';
import { ServiceOrderRepository } from '../../../../../../src/modules/service-orders/domain/repositories/service-order.repository';
import { ServiceOrderStatus } from '../../../../../../src/modules/service-orders/domain/enums/service-order-status.enum';

describe('DeliverServiceOrderUseCase', () => {
  let useCase: DeliverServiceOrderUseCase;
  let repository: jest.Mocked<ServiceOrderRepository>;
  let mockServiceOrder: any;

  beforeEach(() => {
    mockServiceOrder = {
      status: ServiceOrderStatus.FINISHED,
      deliver: jest.fn(),
    };
    repository = {
      findById: jest.fn().mockResolvedValue(mockServiceOrder),
      update: jest.fn(),
    } as any;
    useCase = new DeliverServiceOrderUseCase(repository);
  });

  it('should deliver a service order', async () => {
    await useCase.execute('order-1');
    expect(repository.findById).toHaveBeenCalledWith('order-1');
    expect(mockServiceOrder.deliver).toHaveBeenCalled();
    expect(repository.update).toHaveBeenCalledWith(
      mockServiceOrder,
      ServiceOrderStatus.FINISHED,
    );
  });
});
