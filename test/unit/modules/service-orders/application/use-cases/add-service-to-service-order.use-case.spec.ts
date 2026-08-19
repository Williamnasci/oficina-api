import { AddServiceToServiceOrderUseCase } from '../../../../../../src/modules/service-orders/application/use-cases/add-service-to-service-order.use-case';
import { ServiceOrderRepository } from '../../../../../../src/modules/service-orders/domain/repositories/service-order.repository';
import { NotFoundException } from '@nestjs/common';

describe('AddServiceToServiceOrderUseCase', () => {
  let useCase: AddServiceToServiceOrderUseCase;
  let repository: jest.Mocked<ServiceOrderRepository>;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      addServiceToOrder: jest.fn(),
    } as any;
    useCase = new AddServiceToServiceOrderUseCase(repository);
  });

  it('should add service to order', async () => {
    repository.findById.mockResolvedValue({ id: 'order-1' } as any);
    await useCase.execute('order-1', { serviceId: 'srv-1', quantity: 2 });
    expect(repository.findById).toHaveBeenCalledWith('order-1');
    expect(repository.addServiceToOrder).toHaveBeenCalledWith(
      'order-1',
      'srv-1',
      2,
    );
  });

  it('should throw if order not found', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(
      useCase.execute('order-1', { serviceId: 'srv-1', quantity: 2 }),
    ).rejects.toThrow(NotFoundException);
  });
});
