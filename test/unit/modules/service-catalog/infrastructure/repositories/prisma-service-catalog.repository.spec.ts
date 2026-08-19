import { PrismaServiceCatalogRepository } from '../../../../../../src/modules/service-catalog/infrastructure/repositories/prisma-service-catalog.repository';

describe('PrismaServiceCatalogRepository', () => {
  let repository: PrismaServiceCatalogRepository;
  let prisma: any;

  const mockDbService = {
    id: '1',
    name: 'Oil Change',
    description: 'Full synthetic oil change',
    price: 150,
    estimatedMinutes: 30,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    prisma = {
      serviceCatalog: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };
    repository = new PrismaServiceCatalogRepository(prisma);
  });

  describe('findById', () => {
    it('should return service when found', async () => {
      prisma.serviceCatalog.findUnique.mockResolvedValue(mockDbService);
      const result = await repository.findById('1');
      expect(result).not.toBeNull();
      expect(result!.name).toBe('Oil Change');
    });

    it('should return null when not found', async () => {
      prisma.serviceCatalog.findUnique.mockResolvedValue(null);
      const result = await repository.findById('1');
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all services', async () => {
      prisma.serviceCatalog.findMany.mockResolvedValue([mockDbService]);
      const result = await repository.findAll();
      expect(result).toHaveLength(1);
    });
  });
});
