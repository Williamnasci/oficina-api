import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { StockItem } from '../../domain/entities/stock-item.entity';
import { StockItemRepository } from '../../domain/repositories/stock-item.repository';

@Injectable()
export class PrismaStockItemRepository implements StockItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(stockItem: StockItem): Promise<void> {
    try {
      await this.prisma.stockItem.create({
        data: {
          id: stockItem.id,
          name: stockItem.name,
          description: stockItem.description,
          sku: stockItem.sku,
          quantity: stockItem.quantity,
          unitPrice: stockItem.unitPrice,
          isActive: stockItem.isActive,
          createdAt: stockItem.createdAt,
          updatedAt: stockItem.updatedAt,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('SKU already registered.');
        }
      }

      throw error;
    }
  }

  async findById(id: string): Promise<StockItem | null> {
    const data = await this.prisma.stockItem.findUnique({ where: { id } });

    if (!data) return null;

    return new StockItem({
      id: data.id,
      name: data.name,
      description: data.description,
      sku: data.sku,
      quantity: data.quantity,
      unitPrice: Number(data.unitPrice),
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  async findBySku(sku: string): Promise<StockItem | null> {
    const data = await this.prisma.stockItem.findUnique({ where: { sku } });

    if (!data) return null;

    return new StockItem({
      id: data.id,
      name: data.name,
      description: data.description,
      sku: data.sku,
      quantity: data.quantity,
      unitPrice: Number(data.unitPrice),
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  async findAll(): Promise<StockItem[]> {
    const data = await this.prisma.stockItem.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return data.map(
      (item) =>
        new StockItem({
          id: item.id,
          name: item.name,
          description: item.description,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          isActive: item.isActive,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        }),
    );
  }

  async update(stockItem: StockItem): Promise<void> {
    try {
      await this.prisma.stockItem.update({
        where: { id: stockItem.id },
        data: {
          name: stockItem.name,
          description: stockItem.description,
          sku: stockItem.sku,
          quantity: stockItem.quantity,
          unitPrice: stockItem.unitPrice,
          isActive: stockItem.isActive,
          updatedAt: stockItem.updatedAt,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('SKU already registered.');
        }

        if (error.code === 'P2025') {
          throw new NotFoundException('Stock item not found.');
        }
      }

      throw error;
    }
  }
}
