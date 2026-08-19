import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ServiceOrderRepository } from '../../domain/repositories/service-order.repository';
import { AddStockItemToServiceOrderDto } from '../dto/add-stock-item-to-service-order.dto';

@Injectable()
export class AddStockItemToServiceOrderUseCase {
  constructor(
    @Inject(ServiceOrderRepository)
    private readonly serviceOrderRepository: ServiceOrderRepository,
  ) {}

  async execute(
    serviceOrderId: string,
    input: AddStockItemToServiceOrderDto,
  ): Promise<void> {
    const serviceOrder =
      await this.serviceOrderRepository.findById(serviceOrderId);

    if (!serviceOrder) {
      throw new NotFoundException('Service order not found.');
    }

    await this.serviceOrderRepository.addStockItemToOrder(
      serviceOrderId,
      input.stockItemId,
      input.quantity,
    );
  }
}
