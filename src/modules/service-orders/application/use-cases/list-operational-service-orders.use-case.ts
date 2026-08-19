import { Inject, Injectable } from '@nestjs/common';
import { ServiceOrderMapper } from '../mappers/service-order.mapper';
import { ServiceOrderResponseDto } from '../dto/service-order-response.dto';
import { ServiceOrderRepository } from '../../domain/repositories/service-order.repository';

@Injectable()
export class ListOperationalServiceOrdersUseCase {
  constructor(
    @Inject(ServiceOrderRepository)
    private readonly serviceOrderRepository: ServiceOrderRepository,
  ) {}

  async execute(): Promise<ServiceOrderResponseDto[]> {
    const serviceOrders =
      await this.serviceOrderRepository.findOperationalQueue();

    return serviceOrders.map((order) =>
      ServiceOrderMapper.toResponseDto(order),
    );
  }
}
