import { NotFoundException } from '@nestjs/common';
import { GetServiceOrderStatusUseCase } from '../../../../../../src/modules/service-orders/application/use-cases/get-service-order-status.use-case';
import { ServiceOrder } from '../../../../../../src/modules/service-orders/domain/entities/service-order.entity';
import { ServiceOrderStatus } from '../../../../../../src/modules/service-orders/domain/enums/service-order-status.enum';

describe('GetServiceOrderStatusUseCase', () => {
  let useCase: GetServiceOrderStatusUseCase;
  let repo: any;

  beforeEach(() => {
    repo = { findById: jest.fn() };
    useCase = new GetServiceOrderStatusUseCase(repo);
  });

  it('should return current status with label', async () => {
    const updatedAt = new Date('2026-05-05T12:00:00.000Z');
    repo.findById.mockResolvedValue(
      new ServiceOrder({
        id: '1',
        customerId: 'c-1',
        vehicleId: 'v-1',
        status: ServiceOrderStatus.WAITING_APPROVAL,
        updatedAt,
      }),
    );

    const result = await useCase.execute('1');

    expect(result).toEqual({
      id: '1',
      status: ServiceOrderStatus.WAITING_APPROVAL,
      statusLabel: 'Aguardando Aprovacao',
      updatedAt,
    });
  });

  it('should return approved status with label', async () => {
    const updatedAt = new Date('2026-05-05T12:00:00.000Z');
    repo.findById.mockResolvedValue(
      new ServiceOrder({
        id: '1',
        customerId: 'c-1',
        vehicleId: 'v-1',
        status: ServiceOrderStatus.APPROVED,
        updatedAt,
      }),
    );

    const result = await useCase.execute('1');

    expect(result).toEqual({
      id: '1',
      status: ServiceOrderStatus.APPROVED,
      statusLabel: 'Aprovada',
      updatedAt,
    });
  });

  it('should throw NotFoundException when order does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.execute('1')).rejects.toThrow(NotFoundException);
  });
});
