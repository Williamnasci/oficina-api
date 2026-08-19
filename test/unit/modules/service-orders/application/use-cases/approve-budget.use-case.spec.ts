import { NotFoundException } from '@nestjs/common';
import { ApproveBudgetUseCase } from '../../../../../../src/modules/service-orders/application/use-cases/approve-budget.use-case';

describe('ApproveBudgetUseCase', () => {
  let useCase: ApproveBudgetUseCase;
  let repo: any;

  beforeEach(() => {
    repo = { findById: jest.fn(), update: jest.fn() };
    useCase = new ApproveBudgetUseCase(repo);
  });

  it('should approve budget', async () => {
    const order = { approveBudget: jest.fn() };
    repo.findById.mockResolvedValue(order);
    repo.update.mockResolvedValue(undefined);

    await useCase.execute('1');
    expect(order.approveBudget).toHaveBeenCalled();
    expect(repo.update).toHaveBeenCalledWith(order);
  });

  it('should throw NotFoundException when not found', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(useCase.execute('1')).rejects.toThrow(NotFoundException);
  });
});
