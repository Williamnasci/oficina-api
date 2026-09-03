import { ServiceOrder } from '../entities/service-order.entity';
import { ServiceOrderStatus } from '../enums/service-order-status.enum';
import { ServiceOrderDetailsReadModel } from './service-order-details.read-model';
import { TransactionContext } from '../../../../shared/domain/unit-of-work';

export abstract class ServiceOrderRepository {
  abstract create(
    serviceOrder: ServiceOrder,
    tx?: TransactionContext,
  ): Promise<void>;
  abstract findById(id: string): Promise<ServiceOrder | null>;
  abstract findDetailsById(
    id: string,
  ): Promise<ServiceOrderDetailsReadModel | null>;
  abstract findAll(): Promise<ServiceOrder[]>;
  abstract findOperationalQueue(): Promise<ServiceOrder[]>;
  abstract findByCustomerId(customerId: string): Promise<ServiceOrder[]>;
  abstract getAverageExecutionTimeInMinutes(): Promise<number>;
  abstract update(
    serviceOrder: ServiceOrder,
    expectedStatus?: ServiceOrderStatus,
  ): Promise<void>;
  abstract addServiceToOrder(
    serviceOrderId: string,
    serviceId: string,
    quantity: number,
    tx?: TransactionContext,
  ): Promise<void>;
  abstract addStockItemToOrder(
    serviceOrderId: string,
    stockItemId: string,
    quantity: number,
    tx?: TransactionContext,
  ): Promise<void>;
}
