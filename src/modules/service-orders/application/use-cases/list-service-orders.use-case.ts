import { Inject, Injectable } from '@nestjs/common';
import { ServiceOrderResponseDto } from '../dto/service-order-response.dto';
import { ServiceOrderMapper } from '../mappers/service-order.mapper';
import { ServiceOrderRepository } from '../../domain/repositories/service-order.repository';

@Injectable()
export class ListServiceOrdersUseCase {
  constructor(
    @Inject(ServiceOrderRepository)
    private readonly serviceOrderRepository: ServiceOrderRepository,
  ) {}

  async execute(): Promise<ServiceOrderResponseDto[]> {
    const serviceOrders = await this.serviceOrderRepository.findAll();

    return serviceOrders.map(ServiceOrderMapper.toResponseDto);
  }
}
