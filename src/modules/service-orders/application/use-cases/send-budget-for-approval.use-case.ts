import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { ServiceOrderRepository } from '../../domain/repositories/service-order.repository';
import { StatusNotificationGateway } from '../ports/status-notification.gateway';

@Injectable()
export class SendBudgetForApprovalUseCase {
    constructor(
        @Inject(ServiceOrderRepository)
        private readonly serviceOrderRepository: ServiceOrderRepository,
        @Optional() @Inject(StatusNotificationGateway)
        private readonly statusNotificationGateway?: StatusNotificationGateway,
    ) { }

    async execute(serviceOrderId: string): Promise<void> {
        const serviceOrder = await this.serviceOrderRepository.findById(serviceOrderId);

        if (!serviceOrder) {
            throw new NotFoundException('Service order not found.');
        }

        serviceOrder.sendBudgetForApproval();

        await this.serviceOrderRepository.update(serviceOrder);
        await this.statusNotificationGateway?.notifyStatusChanged({ serviceOrderId, status: serviceOrder.status, occurredAt: new Date().toISOString(), createdAt: serviceOrder.createdAt.toISOString() });
    }
}
