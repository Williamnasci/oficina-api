import { GetServiceOrderUseCase } from '../../../../../../src/modules/service-orders/application/use-cases/get-service-order.use-case';
import { ServiceOrderRepository } from '../../../../../../src/modules/service-orders/domain/repositories/service-order.repository';
import { NotFoundException } from '@nestjs/common';

describe('GetServiceOrderUseCase', () => {
  let useCase: GetServiceOrderUseCase;
  let repository: jest.Mocked<ServiceOrderRepository>;

  beforeEach(() => {
    repository = {
      findDetailsById: jest.fn(),
    } as any;
    useCase = new GetServiceOrderUseCase(repository);
  });

  it('should return service order details', async () => {
    const mockDetails = { id: 'order-1', status: 'OPEN' };
    repository.findDetailsById.mockResolvedValue(mockDetails as any);

    const result = await useCase.execute('order-1');
    expect(repository.findDetailsById).toHaveBeenCalledWith('order-1');
    expect(result).toEqual(mockDetails);
  });

  it('should throw if order not found', async () => {
    repository.findDetailsById.mockResolvedValue(null);
    await expect(useCase.execute('order-1')).rejects.toThrow(NotFoundException);
  });
});
