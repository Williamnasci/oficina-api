import { PrismaServiceOrderRepository } from '../../../../../../src/modules/service-orders/infrastructure/repositories/prisma-service-order.repository';
import { ServiceOrder } from '../../../../../../src/modules/service-orders/domain/entities/service-order.entity';
import { ServiceOrderStatus } from '../../../../../../src/modules/service-orders/domain/enums/service-order-status.enum';

describe('PrismaServiceOrderRepository', () => {
  let repository: PrismaServiceOrderRepository;
  let prisma: any;

  const mockDbOrder = {
    id: '1',
    customerId: 'c-1',
    vehicleId: 'v-1',
    status: 'RECEIVED',
    diagnosis: null,
    servicesAmount: 0,
    stockItemsAmount: 0,
    totalAmount: 0,
    createdAt: new Date(),
    startedAt: null,
    finishedAt: null,
    deliveredAt: null,
    updatedAt: new Date(),
  };

  beforeEach(() => {
    prisma = {
      serviceOrder: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    repository = new PrismaServiceOrderRepository(prisma);
  });

  describe('create', () => {
    it('should create a service order', async () => {
      prisma.serviceOrder.create.mockResolvedValue(undefined);
      const order = new ServiceOrder({
        id: '1',
        customerId: 'c-1',
        vehicleId: 'v-1',
      });
      await expect(repository.create(order)).resolves.not.toThrow();
    });
  });

  describe('findById', () => {
    it('should return order when found', async () => {
      prisma.serviceOrder.findUnique.mockResolvedValue(mockDbOrder);
      const result = await repository.findById('1');
      expect(result).not.toBeNull();
      expect(result!.status).toBe(ServiceOrderStatus.RECEIVED);
    });

    it('should return null when not found', async () => {
      prisma.serviceOrder.findUnique.mockResolvedValue(null);
      const result = await repository.findById('1');
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all orders', async () => {
      prisma.serviceOrder.findMany.mockResolvedValue([mockDbOrder]);
      const result = await repository.findAll();
      expect(result).toHaveLength(1);
    });
  });

  describe('findOperationalQueue', () => {
    it('should return active orders ordered by status priority and creation date', async () => {
      const oldWaiting = {
        ...mockDbOrder,
        id: 'waiting-old',
        status: ServiceOrderStatus.WAITING_APPROVAL,
        createdAt: new Date('2026-05-05T10:00:00.000Z'),
      };
      const newProgress = {
        ...mockDbOrder,
        id: 'progress-new',
        status: ServiceOrderStatus.IN_PROGRESS,
        createdAt: new Date('2026-05-05T12:00:00.000Z'),
      };
      const oldApproved = {
        ...mockDbOrder,
        id: 'approved-old',
        status: ServiceOrderStatus.APPROVED,
        createdAt: new Date('2026-05-05T09:00:00.000Z'),
      };
      const oldReceived = {
        ...mockDbOrder,
        id: 'received-old',
        status: ServiceOrderStatus.RECEIVED,
        createdAt: new Date('2026-05-05T08:00:00.000Z'),
      };

      prisma.serviceOrder.findMany.mockResolvedValue([
        oldReceived,
        oldWaiting,
        newProgress,
        oldApproved,
      ]);

      const result = await repository.findOperationalQueue();

      expect(prisma.serviceOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: expect.objectContaining({
              in: expect.arrayContaining([
                ServiceOrderStatus.IN_PROGRESS,
                ServiceOrderStatus.APPROVED,
                ServiceOrderStatus.WAITING_APPROVAL,
                ServiceOrderStatus.IN_DIAGNOSIS,
                ServiceOrderStatus.RECEIVED,
              ]),
            }),
          }),
        }),
      );
      expect(result.map((order) => order.id)).toEqual([
        'progress-new',
        'approved-old',
        'waiting-old',
        'received-old',
      ]);
    });
  });

  describe('findByCustomerId', () => {
    it('should return orders by customer', async () => {
      prisma.serviceOrder.findMany.mockResolvedValue([mockDbOrder]);
      const result = await repository.findByCustomerId('c-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('getAverageExecutionTimeInMinutes', () => {
    it('should return average execution time for finished orders', async () => {
      prisma.serviceOrder.findMany.mockResolvedValue([
        {
          startedAt: new Date('2026-05-05T10:00:00.000Z'),
          finishedAt: new Date('2026-05-05T12:00:00.000Z'),
        },
        {
          startedAt: new Date('2026-05-05T13:00:00.000Z'),
          finishedAt: new Date('2026-05-05T16:00:00.000Z'),
        },
      ]);

      const result = await repository.getAverageExecutionTimeInMinutes();

      expect(result).toBe(150);
    });

    it('should return zero when no finished orders exist', async () => {
      prisma.serviceOrder.findMany.mockResolvedValue([]);

      const result = await repository.getAverageExecutionTimeInMinutes();

      expect(result).toBe(0);
    });
  });

  describe('update', () => {
    it('should update order', async () => {
      prisma.serviceOrder.update.mockResolvedValue(undefined);
      const order = new ServiceOrder({
        id: '1',
        customerId: 'c-1',
        vehicleId: 'v-1',
      });
      await expect(repository.update(order)).resolves.not.toThrow();
    });
  });

  describe('findDetailsById', () => {
    it('should return order details with items', async () => {
      prisma.serviceOrder.findUnique.mockResolvedValue({
        ...mockDbOrder,
        services: [
          {
            id: 's-1',
            serviceId: 'svc-1',
            quantity: 1,
            unitPrice: 100,
            totalPrice: 100,
            service: { name: 'Oil Change' },
          },
        ],
        stockItems: [
          {
            id: 'si-1',
            stockItemId: 'stk-1',
            quantity: 2,
            unitPrice: 50,
            totalPrice: 100,
            stockItem: { name: 'Brake Pad' },
          },
        ],
      });

      const result = await repository.findDetailsById('1');
      expect(result).not.toBeNull();
      expect(result!.services).toHaveLength(1);
      expect(result!.stockItems).toHaveLength(1);
    });

    it('should return null when not found', async () => {
      prisma.serviceOrder.findUnique.mockResolvedValue(null);
      const result = await repository.findDetailsById('1');
      expect(result).toBeNull();
    });
  });
});
