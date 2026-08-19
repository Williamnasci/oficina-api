import { NotFoundException } from '@nestjs/common';
import { CreateServiceOrderUseCase } from '../../../../../../src/modules/service-orders/application/use-cases/create-service-order.use-case';
import { DomainException } from '../../../../../../src/shared/domain/errors/domain.exception';

describe('CreateServiceOrderUseCase', () => {
  let useCase: CreateServiceOrderUseCase;
  let serviceOrderRepo: any;
  let customerRepo: any;
  let vehicleRepo: any;
  let metricsService: any;

  beforeEach(() => {
    serviceOrderRepo = { create: jest.fn() };
    customerRepo = { findById: jest.fn(), findByDocument: jest.fn() };
    vehicleRepo = { findById: jest.fn() };
    metricsService = { recordServiceOrderCreated: jest.fn() };
    useCase = new CreateServiceOrderUseCase(
      serviceOrderRepo,
      customerRepo,
      vehicleRepo,
      metricsService,
    );
  });

  it('should create a service order with active customer and vehicle', async () => {
    customerRepo.findById.mockResolvedValue({ id: 'c-1', isActive: true });
    vehicleRepo.findById.mockResolvedValue({
      id: 'v-1',
      customerId: 'c-1',
      isActive: true,
    });
    serviceOrderRepo.create.mockResolvedValue(undefined);

    const result = await useCase.execute({
      customerId: 'c-1',
      vehicleId: 'v-1',
    });
    expect(result.id).toBeDefined();
    expect(serviceOrderRepo.create).toHaveBeenCalled();
  });

  it('should create a service order using customer document', async () => {
    customerRepo.findByDocument.mockResolvedValue({
      id: 'c-1',
      isActive: true,
    });
    vehicleRepo.findById.mockResolvedValue({
      id: 'v-1',
      customerId: 'c-1',
      isActive: true,
    });
    serviceOrderRepo.create.mockResolvedValue(undefined);

    const result = await useCase.execute({
      customerDocument: '52998224725',
      vehicleId: 'v-1',
    });

    expect(result.id).toBeDefined();
    expect(customerRepo.findByDocument).toHaveBeenCalledWith('52998224725');
    expect(serviceOrderRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'c-1', vehicleId: 'v-1' }),
    );
  });

  it('should throw DomainException when customer id and document are missing', async () => {
    await expect(useCase.execute({ vehicleId: 'v-1' })).rejects.toThrow(
      DomainException,
    );
  });

  it('should throw NotFoundException when customer not found', async () => {
    customerRepo.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({ customerId: 'c-1', vehicleId: 'v-1' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw DomainException when customer is inactive', async () => {
    customerRepo.findById.mockResolvedValue({ id: 'c-1', isActive: false });
    await expect(
      useCase.execute({ customerId: 'c-1', vehicleId: 'v-1' }),
    ).rejects.toThrow(DomainException);
  });

  it('should throw NotFoundException when vehicle not found', async () => {
    customerRepo.findById.mockResolvedValue({ id: 'c-1', isActive: true });
    vehicleRepo.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({ customerId: 'c-1', vehicleId: 'v-1' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw DomainException when vehicle is inactive', async () => {
    customerRepo.findById.mockResolvedValue({ id: 'c-1', isActive: true });
    vehicleRepo.findById.mockResolvedValue({
      id: 'v-1',
      customerId: 'c-1',
      isActive: false,
    });
    await expect(
      useCase.execute({ customerId: 'c-1', vehicleId: 'v-1' }),
    ).rejects.toThrow(DomainException);
  });

  it('should throw DomainException when vehicle does not belong to customer', async () => {
    customerRepo.findById.mockResolvedValue({ id: 'c-1', isActive: true });
    vehicleRepo.findById.mockResolvedValue({
      id: 'v-1',
      customerId: 'c-OTHER',
      isActive: true,
    });
    await expect(
      useCase.execute({ customerId: 'c-1', vehicleId: 'v-1' }),
    ).rejects.toThrow(DomainException);
  });
});
