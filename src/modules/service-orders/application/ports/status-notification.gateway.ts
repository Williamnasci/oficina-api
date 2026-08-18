import { ServiceOrderStatus } from '../../domain/enums/service-order-status.enum';

export type ServiceOrderStatusChanged = {
  serviceOrderId: string;
  status: ServiceOrderStatus;
  occurredAt: string;
  createdAt: string;
};

export abstract class StatusNotificationGateway {
  abstract notifyStatusChanged(event: ServiceOrderStatusChanged): Promise<void>;
}
