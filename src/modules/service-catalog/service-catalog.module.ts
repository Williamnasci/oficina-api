import { Module } from '@nestjs/common';
import { CreateServiceCatalogUseCase } from './application/use-cases/create-service-catalog.use-case';
import { GetServiceCatalogUseCase } from './application/use-cases/get-service-catalog.use-case';
import { ListServiceCatalogUseCase } from './application/use-cases/list-service-catalog.use-case';
import { UpdateServiceCatalogUseCase } from './application/use-cases/update-service-catalog.use-case';
import { ServiceCatalogRepository } from './domain/repositories/service-catalog.repository';
import { PrismaServiceCatalogRepository } from './infrastructure/repositories/prisma-service-catalog.repository';
import { ServiceCatalogController } from './interfaces/http/controllers/service-catalog.controller';
import { DeleteServiceCatalogUseCase } from './application/use-cases/delete-service-catalog.use-case';

@Module({
  controllers: [ServiceCatalogController],
  providers: [
    CreateServiceCatalogUseCase,
    GetServiceCatalogUseCase,
    ListServiceCatalogUseCase,
    UpdateServiceCatalogUseCase,
    DeleteServiceCatalogUseCase,
    {
      provide: ServiceCatalogRepository,
      useClass: PrismaServiceCatalogRepository,
    },
  ],
  exports: [ServiceCatalogRepository],
})
export class ServiceCatalogModule {}
