import { FinishServiceOrderUseCase } from '../../../../../../src/modules/service-orders/application/use-cases/finish-service-order.use-case';
import { ServiceOrderRepository } from '../../../../../../src/modules/service-orders/domain/repositories/service-order.repository';
import { ServiceOrderStatus } from '../../../../../../src/modules/service-orders/domain/enums/service-order-status.enum';
import { StatusNotificationGateway } from '../../../../../../src/modules/service-orders/application/ports/status-notification.gateway';

describe('FinishServiceOrderUseCase', () => {
  let useCase: FinishServiceOrderUseCase;
  let repository: jest.Mocked<ServiceOrderRepository>;
  let mockServiceOrder: any;
  let notificationGateway: jest.Mocked<StatusNotificationGateway>;

  beforeEach(() => {
    mockServiceOrder = {
      finish: jest.fn(function (this: { status: ServiceOrderStatus }) {
        this.status = ServiceOrderStatus.FINISHED;
      }),
      status: ServiceOrderStatus.IN_PROGRESS,
      createdAt: new Date('2026-07-03T10:00:00.000Z'),
    };
    repository = {
      findById: jest.fn().mockResolvedValue(mockServiceOrder),
      update: jest.fn(),
    } as any;
    notificationGateway = {
      notifyStatusChanged: jest.fn(),
    };
    useCase = new FinishServiceOrderUseCase(repository, notificationGateway);
  });

  it('should finish a service order', async () => {
    await useCase.execute('order-1');
    expect(repository.findById).toHaveBeenCalledWith('order-1');
    expect(mockServiceOrder.finish).toHaveBeenCalled();
    expect(repository.update).toHaveBeenCalledWith(
      mockServiceOrder,
      ServiceOrderStatus.IN_PROGRESS,
    );
    expect(notificationGateway.notifyStatusChanged).toHaveBeenCalledWith(
      expect.objectContaining({
        serviceOrderId: 'order-1',
        status: ServiceOrderStatus.FINISHED,
      }),
    );
  });
});
