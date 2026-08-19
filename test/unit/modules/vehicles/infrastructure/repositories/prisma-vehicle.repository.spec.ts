import { PrismaVehicleRepository } from '../../../../../../src/modules/vehicles/infrastructure/repositories/prisma-vehicle.repository';

describe('PrismaVehicleRepository', () => {
  let repository: PrismaVehicleRepository;
  let prisma: any;

  const mockDbVehicle = {
    id: '1',
    customerId: 'c-1',
    licensePlate: 'ABC1234',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2022,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    prisma = {
      vehicle: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };
    repository = new PrismaVehicleRepository(prisma);
  });

  describe('findById', () => {
    it('should return vehicle when found', async () => {
      prisma.vehicle.findUnique.mockResolvedValue(mockDbVehicle);
      const result = await repository.findById('1');
      expect(result).not.toBeNull();
      expect(result!.brand).toBe('Toyota');
    });

    it('should return null when not found', async () => {
      prisma.vehicle.findUnique.mockResolvedValue(null);
      const result = await repository.findById('1');
      expect(result).toBeNull();
    });
  });

  describe('findByLicensePlate', () => {
    it('should return vehicle when found', async () => {
      prisma.vehicle.findUnique.mockResolvedValue(mockDbVehicle);
      const result = await repository.findByLicensePlate('ABC1234');
      expect(result).not.toBeNull();
    });

    it('should return null when not found', async () => {
      prisma.vehicle.findUnique.mockResolvedValue(null);
      const result = await repository.findByLicensePlate('ABC1234');
      expect(result).toBeNull();
    });

    it('should normalize plate', async () => {
      prisma.vehicle.findUnique.mockResolvedValue(null);
      await repository.findByLicensePlate('abc-1234');
      expect(prisma.vehicle.findUnique).toHaveBeenCalledWith({
        where: { licensePlate: 'ABC1234' },
      });
    });
  });

  describe('findAll', () => {
    it('should return all vehicles', async () => {
      prisma.vehicle.findMany.mockResolvedValue([mockDbVehicle]);
      const result = await repository.findAll();
      expect(result).toHaveLength(1);
    });
  });

  describe('findByCustomerId', () => {
    it('should return vehicles by customer', async () => {
      prisma.vehicle.findMany.mockResolvedValue([mockDbVehicle]);
      const result = await repository.findByCustomerId('c-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update vehicle', async () => {
      prisma.vehicle.update.mockResolvedValue(undefined);
      const {
        LicensePlate,
      } = require('../../../../../../src/modules/vehicles/domain/value-objects/license-plate.value-object');
      const {
        Vehicle,
      } = require('../../../../../../src/modules/vehicles/domain/entities/vehicle.entity');
      const vehicle = new Vehicle({
        id: '1',
        customerId: 'c-1',
        licensePlate: new LicensePlate('ABC1234'),
        brand: 'Honda',
        model: 'Civic',
        year: 2023,
      });
      await expect(repository.update(vehicle)).resolves.not.toThrow();
    });
  });
});
