import { Module } from '@nestjs/common';
import { CreateCustomerUseCase } from './application/use-cases/create-customer.use-case';
import { GetCustomerUseCase } from './application/use-cases/get-customer.use-case';
import { ListCustomersUseCase } from './application/use-cases/list-customers.use-case';
import { FindCustomerByDocumentUseCase } from './application/use-cases/find-customer-by-document.use-case';
import { UpdateCustomerUseCase } from './application/use-cases/update-customer.use-case';
import { DeleteCustomerUseCase } from './application/use-cases/delete-customer.use-case';
import { CustomerRepository } from './domain/repositories/customer.repository';
import { PrismaCustomerRepository } from './infrastructure/repositories/prisma-customer.repository';
import { CustomersController } from './interfaces/http/controllers/customers.controller';

@Module({
  controllers: [CustomersController],
  providers: [
    CreateCustomerUseCase,
    GetCustomerUseCase,
    ListCustomersUseCase,
    FindCustomerByDocumentUseCase,
    UpdateCustomerUseCase,
    DeleteCustomerUseCase,
    {
      provide: CustomerRepository,
      useClass: PrismaCustomerRepository,
    },
  ],
  exports: [CustomerRepository],
})
export class CustomersModule {}
