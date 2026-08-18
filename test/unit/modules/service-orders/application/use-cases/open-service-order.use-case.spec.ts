import { OpenServiceOrderUseCase } from '../../../../../../src/modules/service-orders/application/use-cases/open-service-order.use-case';
import { CustomerDocumentType } from '../../../../../../src/modules/customers/domain/enums/customer-document-type.enum';
import { DomainException } from '../../../../../../src/shared/domain/errors/domain.exception';

describe('OpenServiceOrderUseCase', () => {
    let useCase: OpenServiceOrderUseCase;
    let serviceOrderRepo: any;
    let customerRepo: any;
    let vehicleRepo: any;
    let metricsService: any;

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
        stockItems: [
            { stockItemId: 'stk-1', quantity: 3 },
        ],
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
        useCase = new OpenServiceOrderUseCase(serviceOrderRepo, customerRepo, vehicleRepo, metricsService);
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
        );
        expect(serviceOrderRepo.addServiceToOrder).toHaveBeenCalledTimes(2);
        expect(serviceOrderRepo.addStockItemToOrder).toHaveBeenCalledTimes(1);
    });

    it('should reuse active customer and vehicle when they already exist', async () => {
        customerRepo.findByDocument.mockResolvedValue({ id: 'c-1', isActive: true });
        vehicleRepo.findByLicensePlate.mockResolvedValue({ id: 'v-1', customerId: 'c-1', isActive: true });

        await useCase.execute(input);

        expect(customerRepo.create).not.toHaveBeenCalled();
        expect(vehicleRepo.create).not.toHaveBeenCalled();
        expect(serviceOrderRepo.create).toHaveBeenCalledWith(
            expect.objectContaining({ customerId: 'c-1', vehicleId: 'v-1' }),
        );
    });

    it('should throw when existing customer is inactive', async () => {
        customerRepo.findByDocument.mockResolvedValue({ id: 'c-1', isActive: false });

        await expect(useCase.execute(input)).rejects.toThrow(DomainException);
    });

    it('should throw when existing vehicle belongs to another customer', async () => {
        customerRepo.findByDocument.mockResolvedValue({ id: 'c-1', isActive: true });
        vehicleRepo.findByLicensePlate.mockResolvedValue({ id: 'v-1', customerId: 'c-2', isActive: true });

        await expect(useCase.execute(input)).rejects.toThrow(DomainException);
    });
});
