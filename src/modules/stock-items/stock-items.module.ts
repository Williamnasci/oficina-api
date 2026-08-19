import { Module } from '@nestjs/common';
import { CreateStockItemUseCase } from './application/use-cases/create-stock-item.use-case';
import { GetStockItemUseCase } from './application/use-cases/get-stock-item.use-case';
import { ListStockItemsUseCase } from './application/use-cases/list-stock-items.use-case';
import { UpdateStockItemUseCase } from './application/use-cases/update-stock-item.use-case';
import { StockItemRepository } from './domain/repositories/stock-item.repository';
import { PrismaStockItemRepository } from './infrastructure/repositories/prisma-stock-item.repository';
import { StockItemsController } from './interfaces/http/controllers/stock-items.controller';
import { DeleteStockItemUseCase } from './application/use-cases/delete-stock-item.use-case';

@Module({
  controllers: [StockItemsController],
  providers: [
    CreateStockItemUseCase,
    GetStockItemUseCase,
    ListStockItemsUseCase,
    UpdateStockItemUseCase,
    DeleteStockItemUseCase,
    {
      provide: StockItemRepository,
      useClass: PrismaStockItemRepository,
    },
  ],
  exports: [StockItemRepository],
})
export class StockItemsModule {}
