import { NotFoundException } from '@nestjs/common';
import { BudgetDecision } from '../../../../../../src/modules/service-orders/application/dto/budget-decision.dto';
import { HandleBudgetDecisionUseCase } from '../../../../../../src/modules/service-orders/application/use-cases/handle-budget-decision.use-case';

describe('HandleBudgetDecisionUseCase', () => {
  let useCase: HandleBudgetDecisionUseCase;
  let repo: any;

  beforeEach(() => {
    repo = { findById: jest.fn(), update: jest.fn() };
    useCase = new HandleBudgetDecisionUseCase(repo);
  });

  it('should approve budget when decision is APPROVED', async () => {
    const order = { approveBudget: jest.fn(), rejectBudget: jest.fn() };
    repo.findById.mockResolvedValue(order);

    await useCase.execute('1', { decision: BudgetDecision.APPROVED });

    expect(order.approveBudget).toHaveBeenCalled();
    expect(order.rejectBudget).not.toHaveBeenCalled();
    expect(repo.update).toHaveBeenCalledWith(order);
  });

  it('should reject budget when decision is REJECTED', async () => {
    const order = { approveBudget: jest.fn(), rejectBudget: jest.fn() };
    repo.findById.mockResolvedValue(order);

    await useCase.execute('1', { decision: BudgetDecision.REJECTED });

    expect(order.rejectBudget).toHaveBeenCalled();
    expect(order.approveBudget).not.toHaveBeenCalled();
    expect(repo.update).toHaveBeenCalledWith(order);
  });

  it('should throw NotFoundException when order does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('1', { decision: BudgetDecision.APPROVED }),
    ).rejects.toThrow(NotFoundException);
  });
});
