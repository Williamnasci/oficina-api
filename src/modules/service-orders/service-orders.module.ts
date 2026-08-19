import { Module } from '@nestjs/common';
import { CreateServiceOrderUseCase } from './application/use-cases/create-service-order.use-case';
import { DeliverServiceOrderUseCase } from './application/use-cases/deliver-service-order.use-case';
import { FinishServiceOrderUseCase } from './application/use-cases/finish-service-order.use-case';
import { GetServiceOrderUseCase } from './application/use-cases/get-service-order.use-case';
import { RegisterDiagnosisUseCase } from './application/use-cases/register-diagnosis.use-case';
import { SendBudgetForApprovalUseCase } from './application/use-cases/send-budget-for-approval.use-case';
import { StartServiceOrderExecutionUseCase } from './application/use-cases/start-service-order-execution.use-case';
import { AddServiceToServiceOrderUseCase } from './application/use-cases/add-service-to-service-order.use-case';
import { AddStockItemToServiceOrderUseCase } from './application/use-cases/add-stock-item-to-service-order.use-case';
import { ApproveBudgetUseCase } from './application/use-cases/approve-budget.use-case';
import { FindServiceOrdersByDocumentUseCase } from './application/use-cases/find-service-orders-by-document.use-case';
import { GetAverageExecutionTimeUseCase } from './application/use-cases/get-average-execution-time.use-case';
import { GetServiceOrderStatusUseCase } from './application/use-cases/get-service-order-status.use-case';
import { HandleBudgetDecisionUseCase } from './application/use-cases/handle-budget-decision.use-case';
import { ListOperationalServiceOrdersUseCase } from './application/use-cases/list-operational-service-orders.use-case';
import { ListServiceOrdersUseCase } from './application/use-cases/list-service-orders.use-case';
import { OpenServiceOrderUseCase } from './application/use-cases/open-service-order.use-case';
import { ServiceOrderRepository } from './domain/repositories/service-order.repository';
import { PrismaServiceOrderRepository } from './infrastructure/repositories/prisma-service-order.repository';
import { ServiceOrdersController } from './interfaces/http/controllers/service-orders.controller';
import { CustomersModule } from '../customers/customers.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { ObservabilityModule } from '../../observability/observability.module';
import { StatusNotificationGateway } from './application/ports/status-notification.gateway';
import { WebhookStatusNotificationGateway } from './infrastructure/notifications/webhook-status-notification.gateway';
import { MetricsStatusNotificationGateway } from './infrastructure/notifications/metrics-status-notification.gateway';

@Module({
  imports: [CustomersModule, VehiclesModule, ObservabilityModule],
  controllers: [ServiceOrdersController],
  providers: [
    AddServiceToServiceOrderUseCase,
    CreateServiceOrderUseCase,
    GetServiceOrderUseCase,
    RegisterDiagnosisUseCase,
    SendBudgetForApprovalUseCase,
    StartServiceOrderExecutionUseCase,
    FinishServiceOrderUseCase,
    DeliverServiceOrderUseCase,
    AddStockItemToServiceOrderUseCase,
    ApproveBudgetUseCase,
    FindServiceOrdersByDocumentUseCase,
    GetAverageExecutionTimeUseCase,
    GetServiceOrderStatusUseCase,
    HandleBudgetDecisionUseCase,
    ListOperationalServiceOrdersUseCase,
    ListServiceOrdersUseCase,
    OpenServiceOrderUseCase,
    {
      provide: ServiceOrderRepository,
      useClass: PrismaServiceOrderRepository,
    },
    WebhookStatusNotificationGateway,
    {
      provide: StatusNotificationGateway,
      useClass: MetricsStatusNotificationGateway,
    },
  ],
  exports: [ServiceOrderRepository],
})
export class ServiceOrdersModule {}
