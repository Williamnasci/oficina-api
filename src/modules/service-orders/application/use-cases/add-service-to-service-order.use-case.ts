import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ServiceOrderRepository } from '../../domain/repositories/service-order.repository';
import { AddServiceToServiceOrderDto } from '../dto/add-service-to-service-order.dto';

@Injectable()
export class AddServiceToServiceOrderUseCase {
  constructor(
    @Inject(ServiceOrderRepository)
    private readonly serviceOrderRepository: ServiceOrderRepository,
  ) {}

  async execute(
    serviceOrderId: string,
    input: AddServiceToServiceOrderDto,
  ): Promise<void> {
    const serviceOrder =
      await this.serviceOrderRepository.findById(serviceOrderId);

    if (!serviceOrder) {
      throw new NotFoundException('Service order not found.');
    }

    await this.serviceOrderRepository.addServiceToOrder(
      serviceOrderId,
      input.serviceId,
      input.quantity,
    );
  }
}
