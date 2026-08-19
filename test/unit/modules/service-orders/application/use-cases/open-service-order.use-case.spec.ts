import { OpenServiceOrderUseCase } from '../../../../../../src/modules/service-orders/application/use-cases/open-service-order.use-case';
import { CustomerDocumentType } from '../../../../../../src/modules/customers/domain/enums/customer-document-type.enum';
import { DomainException } from '../../../../../../src/shared/domain/errors/domain.exception';

describe('OpenServiceOrderUseCase', () => {
  let useCase: OpenServiceOrderUseCase;
  let serviceOrderRepo: any;
  let customerRepo: any;
  let vehicleRepo: any;
  let metricsService: any;
  let unitOfWork: any;

  const input = {
    customer: {
      name: 'John Doe',
      documentType: CustomerDocumentType.CPF,
      document: '52998224725',
      phone: '11999999999',
      email: 'john@example.com',
    },
    vehicle: {
      licensePlate: 'ABC1D23',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2022,
    },
    services: [
      { serviceId: 'svc-1', quantity: 1 },
      { serviceId: 'svc-2', quantity: 2 },
    ],
    stockItems: [{ stockItemId: 'stk-1', quantity: 3 }],
  };

  beforeEach(() => {
    serviceOrderRepo = {
      create: jest.fn(),
      addServiceToOrder: jest.fn(),
      addStockItemToOrder: jest.fn(),
    };
    customerRepo = {
      create: jest.fn(),
      findByDocument: jest.fn(),
    };
    vehicleRepo = {
      create: jest.fn(),
      findByLicensePlate: jest.fn(),
    };
    metricsService = { recordServiceOrderCreated: jest.fn() };
    // Simula o comportamento real do UnitOfWork sem abrir uma transacao
    // de verdade: so executa o callback com um tx fake e repassa o
    // resultado/erro, preservando o comportamento sincrono esperado
    // pelos testes abaixo.
    unitOfWork = {
      runInTransaction: jest.fn((work: (tx: unknown) => Promise<unknown>) =>
        work({}),
      ),
    };
    useCase = new OpenServiceOrderUseCase(
      serviceOrderRepo,
      customerRepo,
      vehicleRepo,
      metricsService,
      unitOfWork,
    );
  });

  it('should create customer, vehicle, order and items when none exist', async () => {
    customerRepo.findByDocument.mockResolvedValue(null);
    vehicleRepo.findByLicensePlate.mockResolvedValue(null);

    const result = await useCase.execute(input);

    expect(result.id).toBeDefined();
    expect(customerRepo.create).toHaveBeenCalled();
    expect(vehicleRepo.create).toHaveBeenCalled();
    expect(serviceOrderRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: expect.any(String),
        vehicleId: expect.any(String),
      }),
      expect.anything(),
    );
    expect(serviceOrderRepo.addServiceToOrder).toHaveBeenCalledTimes(2);
    expect(serviceOrderRepo.addStockItemToOrder).toHaveBeenCalledTimes(1);
  });

  it('should run every write inside a single UnitOfWork transaction, passing the same tx to all repositories', async () => {
    customerRepo.findByDocument.mockResolvedValue(null);
    vehicleRepo.findByLicensePlate.mockResolvedValue(null);

    await useCase.execute(input);

    expect(unitOfWork.runInTransaction).toHaveBeenCalledTimes(1);

    // Todas as escritas devem ter recebido o MESMO tx (o objeto fake
    // passado pelo mock de runInTransaction) como ultimo argumento -
    // prova de que ninguem esqueceu de repassar o contexto transacional.
    const receivedTxs = [
      customerRepo.create.mock.calls[0]?.[1],
      vehicleRepo.create.mock.calls[0]?.[1],
      serviceOrderRepo.create.mock.calls[0]?.[1],
      ...serviceOrderRepo.addServiceToOrder.mock.calls.map(
        (call: unknown[]) => call[3],
      ),
      ...serviceOrderRepo.addStockItemToOrder.mock.calls.map(
        (call: unknown[]) => call[3],
      ),
    ];

    expect(receivedTxs.length).toBeGreaterThan(0);
    receivedTxs.forEach((tx) => {
      expect(tx).toBeDefined();
      expect(tx).toBe(receivedTxs[0]);
    });
  });

  it('should reuse active customer and vehicle when they already exist', async () => {
    customerRepo.findByDocument.mockResolvedValue({
      id: 'c-1',
      isActive: true,
    });
    vehicleRepo.findByLicensePlate.mockResolvedValue({
      id: 'v-1',
      customerId: 'c-1',
      isActive: true,
    });

    await useCase.execute(input);

    expect(customerRepo.create).not.toHaveBeenCalled();
    expect(vehicleRepo.create).not.toHaveBeenCalled();
    expect(serviceOrderRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'c-1', vehicleId: 'v-1' }),
      expect.anything(),
    );
  });

  it('should throw when existing customer is inactive', async () => {
    customerRepo.findByDocument.mockResolvedValue({
      id: 'c-1',
      isActive: false,
    });

    await expect(useCase.execute(input)).rejects.toThrow(DomainException);
  });

  it('should throw when existing vehicle belongs to another customer', async () => {
    customerRepo.findByDocument.mockResolvedValue({
      id: 'c-1',
      isActive: true,
    });
    vehicleRepo.findByLicensePlate.mockResolvedValue({
      id: 'v-1',
      customerId: 'c-2',
      isActive: true,
    });

    await expect(useCase.execute(input)).rejects.toThrow(DomainException);
  });

  it('should not record the "created" metric when the transaction is rolled back', async () => {
    customerRepo.findByDocument.mockResolvedValue(null);
    vehicleRepo.findByLicensePlate.mockResolvedValue(null);
    // Simula uma falha no meio do fluxo (ex.: estoque insuficiente no
    // ultimo item) propagando o erro atraves do UnitOfWork, como o
    // Prisma faria de verdade ao rejeitar o callback de $transaction.
    serviceOrderRepo.addStockItemToOrder.mockRejectedValue(
      new Error('Insufficient stock quantity.'),
    );

    await expect(useCase.execute(input)).rejects.toThrow(
      'Insufficient stock quantity.',
    );

    expect(metricsService.recordServiceOrderCreated).not.toHaveBeenCalled();
  });
});
