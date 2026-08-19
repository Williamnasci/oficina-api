import { PrismaCustomerRepository } from '../../../../../../src/modules/customers/infrastructure/repositories/prisma-customer.repository';
import { Customer } from '../../../../../../src/modules/customers/domain/entities/customer.entity';
import { CustomerDocument } from '../../../../../../src/modules/customers/domain/value-objects/customer-document.value-object';
import { CustomerDocumentType } from '../../../../../../src/modules/customers/domain/enums/customer-document-type.enum';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('PrismaCustomerRepository', () => {
  let repository: PrismaCustomerRepository;
  let prisma: any;

  const mockDbCustomer = {
    id: '1',
    name: 'John',
    document: '52998224725',
    documentType: 'CPF',
    phone: '11999',
    email: 'j@t.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    prisma = {
      customer: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };
    repository = new PrismaCustomerRepository(prisma);
  });

  describe('create', () => {
    it('should create a customer', async () => {
      prisma.customer.create.mockResolvedValue(undefined);
      const doc = new CustomerDocument('52998224725', CustomerDocumentType.CPF);
      const customer = new Customer({ id: '1', name: 'John', document: doc });
      await expect(repository.create(customer)).resolves.not.toThrow();
    });

    it('should throw ConflictException on P2002', async () => {
      const error: any = new Error();
      error.code = 'P2002';
      error.constructor = { name: 'PrismaClientKnownRequestError' };
      // Simulating Prisma error
      prisma.customer.create.mockRejectedValue(
        Object.assign(new Error(), {
          code: 'P2002',
          name: 'PrismaClientKnownRequestError',
        }),
      );
      const doc = new CustomerDocument('52998224725', CustomerDocumentType.CPF);
      const customer = new Customer({ id: '1', name: 'John', document: doc });
      await expect(repository.create(customer)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should return customer when found', async () => {
      prisma.customer.findUnique.mockResolvedValue(mockDbCustomer);
      const result = await repository.findById('1');
      expect(result).not.toBeNull();
      expect(result!.name).toBe('John');
    });

    it('should return null when not found', async () => {
      prisma.customer.findUnique.mockResolvedValue(null);
      const result = await repository.findById('1');
      expect(result).toBeNull();
    });
  });

  describe('findByDocument', () => {
    it('should return customer when found', async () => {
      prisma.customer.findUnique.mockResolvedValue(mockDbCustomer);
      const result = await repository.findByDocument('52998224725');
      expect(result).not.toBeNull();
    });

    it('should return null when not found', async () => {
      prisma.customer.findUnique.mockResolvedValue(null);
      const result = await repository.findByDocument('52998224725');
      expect(result).toBeNull();
    });

    it('should normalize document input', async () => {
      prisma.customer.findUnique.mockResolvedValue(null);
      await repository.findByDocument('529.982.247-25');
      expect(prisma.customer.findUnique).toHaveBeenCalledWith({
        where: { document: '52998224725' },
      });
    });
  });

  describe('findAll', () => {
    it('should return all customers', async () => {
      prisma.customer.findMany.mockResolvedValue([mockDbCustomer]);
      const result = await repository.findAll();
      expect(result).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update customer', async () => {
      prisma.customer.update.mockResolvedValue(undefined);
      const doc = new CustomerDocument('52998224725', CustomerDocumentType.CPF);
      const customer = new Customer({
        id: '1',
        name: 'John Updated',
        document: doc,
      });
      await expect(repository.update(customer)).resolves.not.toThrow();
    });
  });
});
