import { RegisterDiagnosisUseCase } from '../../../../../../src/modules/service-orders/application/use-cases/register-diagnosis.use-case';
import { ServiceOrderRepository } from '../../../../../../src/modules/service-orders/domain/repositories/service-order.repository';

describe('RegisterDiagnosisUseCase', () => {
  let useCase: RegisterDiagnosisUseCase;
  let repository: jest.Mocked<ServiceOrderRepository>;
  let mockServiceOrder: any;

  beforeEach(() => {
    mockServiceOrder = {
      registerDiagnosis: jest.fn(),
    };
    repository = {
      findById: jest.fn().mockResolvedValue(mockServiceOrder),
      update: jest.fn(),
    } as any;
    useCase = new RegisterDiagnosisUseCase(repository);
  });

  it('should register a diagnosis', async () => {
    await useCase.execute('order-1', { diagnosis: 'engine broken' });
    expect(repository.findById).toHaveBeenCalledWith('order-1');
    expect(mockServiceOrder.registerDiagnosis).toHaveBeenCalledWith(
      'engine broken',
    );
    expect(repository.update).toHaveBeenCalledWith(mockServiceOrder);
  });
});
