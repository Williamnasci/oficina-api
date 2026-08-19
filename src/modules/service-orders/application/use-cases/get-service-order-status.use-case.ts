import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ServiceOrderStatus } from '../../domain/enums/service-order-status.enum';
import { ServiceOrderRepository } from '../../domain/repositories/service-order.repository';
import { ServiceOrderStatusResponseDto } from '../dto/service-order-status-response.dto';

const STATUS_LABELS: Record<ServiceOrderStatus, string> = {
  [ServiceOrderStatus.RECEIVED]: 'Recebida',
  [ServiceOrderStatus.IN_DIAGNOSIS]: 'Diagnostico',
  [ServiceOrderStatus.WAITING_APPROVAL]: 'Aguardando Aprovacao',
  [ServiceOrderStatus.APPROVED]: 'Aprovada',
  [ServiceOrderStatus.IN_PROGRESS]: 'Execucao',
  [ServiceOrderStatus.FINISHED]: 'Finalizada',
  [ServiceOrderStatus.DELIVERED]: 'Entregue',
};

@Injectable()
export class GetServiceOrderStatusUseCase {
  constructor(
    @Inject(ServiceOrderRepository)
    private readonly serviceOrderRepository: ServiceOrderRepository,
  ) {}

  async execute(
    serviceOrderId: string,
  ): Promise<ServiceOrderStatusResponseDto> {
    const serviceOrder =
      await this.serviceOrderRepository.findById(serviceOrderId);

    if (!serviceOrder) {
      throw new NotFoundException('Service order not found.');
    }

    return {
      id: serviceOrder.id,
      status: serviceOrder.status,
      statusLabel: STATUS_LABELS[serviceOrder.status],
      updatedAt: serviceOrder.updatedAt,
    };
  }
}
