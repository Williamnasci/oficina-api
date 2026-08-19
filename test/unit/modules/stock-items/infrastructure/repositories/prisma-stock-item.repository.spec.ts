import { PrismaStockItemRepository } from '../../../../../../src/modules/stock-items/infrastructure/repositories/prisma-stock-item.repository';
import { PrismaService } from '../../../../../../src/shared/infrastructure/prisma/prisma.service';
import { StockItem } from '../../../../../../src/modules/stock-items/domain/entities/stock-item.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('PrismaStockItemRepository', () => {
  let repository: PrismaStockItemRepository;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      stockItem: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };
    repository = new PrismaStockItemRepository(
      prisma as unknown as PrismaService,
    );
  });

  it('should create stock item', async () => {
    const item = new StockItem({
      id: '1',
      name: 'A',
      unitPrice: 10,
      quantity: 1,
    });
    await repository.create(item);
    expect(prisma.stockItem.create).toHaveBeenCalled();
  });

  it('should catch P2002 on create', async () => {
    const item = new StockItem({
      id: '1',
      name: 'A',
      unitPrice: 10,
      quantity: 1,
    });
    prisma.stockItem.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('msg', {
        code: 'P2002',
        clientVersion: '1',
      }),
    );
    await expect(repository.create(item)).rejects.toThrow(ConflictException);
  });

  it('should find by id', async () => {
    prisma.stockItem.findUnique.mockResolvedValue({
      id: '1',
      name: 'A',
      unitPrice: 10,
      quantity: 1,
    });
    const result = await repository.findById('1');
    expect(result?.name).toBe('A');
  });

  it('should update stock item', async () => {
    const item = new StockItem({
      id: '1',
      name: 'A',
      unitPrice: 10,
      quantity: 1,
    });
    await repository.update(item);
    expect(prisma.stockItem.update).toHaveBeenCalled();
  });

  it('should catch P2025 on update', async () => {
    const item = new StockItem({
      id: '1',
      name: 'A',
      unitPrice: 10,
      quantity: 1,
    });
    prisma.stockItem.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('msg', {
        code: 'P2025',
        clientVersion: '1',
      }),
    );
    await expect(repository.update(item)).rejects.toThrow(NotFoundException);
  });
});
