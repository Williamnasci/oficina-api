import { NotFoundException } from '@nestjs/common';
import { ApproveBudgetUseCase } from '../../../../../../src/modules/service-orders/application/use-cases/approve-budget.use-case';
import { ServiceOrderStatus } from '../../../../../../src/modules/service-orders/domain/enums/service-order-status.enum';

describe('ApproveBudgetUseCase', () => {
  let useCase: ApproveBudgetUseCase;
  let repo: any;

  beforeEach(() => {
    repo = { findById: jest.fn(), update: jest.fn() };
    useCase = new ApproveBudgetUseCase(repo);
  });

  it('should approve budget', async () => {
    const order = {
      status: ServiceOrderStatus.WAITING_APPROVAL,
      approveBudget: jest.fn(),
    };
    repo.findById.mockResolvedValue(order);
    repo.update.mockResolvedValue(undefined);

    await useCase.execute('1');
    expect(order.approveBudget).toHaveBeenCalled();
    expect(repo.update).toHaveBeenCalledWith(
      order,
      ServiceOrderStatus.WAITING_APPROVAL,
    );
  });

  it('should throw NotFoundException when not found', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(useCase.execute('1')).rejects.toThrow(NotFoundException);
  });
});
