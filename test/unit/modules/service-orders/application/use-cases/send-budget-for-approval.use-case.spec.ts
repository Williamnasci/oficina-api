import { SendBudgetForApprovalUseCase } from '../../../../../../src/modules/service-orders/application/use-cases/send-budget-for-approval.use-case';
import { NotFoundException } from '@nestjs/common';
import { ServiceOrderStatus } from '../../../../../../src/modules/service-orders/domain/enums/service-order-status.enum';

describe('SendBudgetForApprovalUseCase', () => {
  let useCase: SendBudgetForApprovalUseCase;
  let repository: any;
  let order: any;

  beforeEach(() => {
    order = {
      status: ServiceOrderStatus.IN_DIAGNOSIS,
      sendBudgetForApproval: jest.fn(),
    };
    repository = {
      findById: jest.fn().mockResolvedValue(order),
      update: jest.fn(),
    };
    useCase = new SendBudgetForApprovalUseCase(repository);
  });

  it('should send budget', async () => {
    await useCase.execute('1');
    expect(order.sendBudgetForApproval).toHaveBeenCalled();
    expect(repository.update).toHaveBeenCalledWith(
      order,
      ServiceOrderStatus.IN_DIAGNOSIS,
    );
  });

  it('should throw if order not found', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(useCase.execute('1')).rejects.toThrow(NotFoundException);
  });
});
