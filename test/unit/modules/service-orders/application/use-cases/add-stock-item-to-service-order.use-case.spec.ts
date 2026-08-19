import { AddStockItemToServiceOrderUseCase } from '../../../../../../src/modules/service-orders/application/use-cases/add-stock-item-to-service-order.use-case';
import { NotFoundException } from '@nestjs/common';

describe('AddStockItemToServiceOrderUseCase', () => {
  let useCase: AddStockItemToServiceOrderUseCase;
  let repository: any;

  beforeEach(() => {
    repository = {
      findById: jest.fn().mockResolvedValue({}),
      addStockItemToOrder: jest.fn(),
    };
    useCase = new AddStockItemToServiceOrderUseCase(repository);
  });

  it('should add stock item', async () => {
    await useCase.execute('1', { stockItemId: 'st-1', quantity: 2 });
    expect(repository.addStockItemToOrder).toHaveBeenCalledWith('1', 'st-1', 2);
  });

  it('should throw if order not found', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(
      useCase.execute('1', { stockItemId: 'st-1', quantity: 2 }),
    ).rejects.toThrow(NotFoundException);
  });
});
