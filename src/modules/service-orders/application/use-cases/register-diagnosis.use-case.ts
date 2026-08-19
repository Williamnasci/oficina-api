import {
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { ServiceOrderRepository } from '../../domain/repositories/service-order.repository';
import { RegisterDiagnosisDto } from '../dto/register-diagnosis.dto';
import { StatusNotificationGateway } from '../ports/status-notification.gateway';

@Injectable()
export class RegisterDiagnosisUseCase {
  constructor(
    @Inject(ServiceOrderRepository)
    private readonly serviceOrderRepository: ServiceOrderRepository,
    @Optional()
    @Inject(StatusNotificationGateway)
    private readonly statusNotificationGateway?: StatusNotificationGateway,
  ) {}

  async execute(
    serviceOrderId: string,
    input: RegisterDiagnosisDto,
  ): Promise<void> {
    const serviceOrder =
      await this.serviceOrderRepository.findById(serviceOrderId);

    if (!serviceOrder) {
      throw new NotFoundException('Service order not found.');
    }

    const previousStatus = serviceOrder.status;
    serviceOrder.registerDiagnosis(input.diagnosis);

    await this.serviceOrderRepository.update(serviceOrder, previousStatus);
    await this.statusNotificationGateway?.notifyStatusChanged({
      serviceOrderId,
      status: serviceOrder.status,
      occurredAt: new Date().toISOString(),
      createdAt: serviceOrder.createdAt.toISOString(),
    });
  }
}
