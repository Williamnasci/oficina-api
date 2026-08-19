import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ServiceOrderDetailsResponseDto } from '../dto/service-order-details-response.dto';
import { ServiceOrderRepository } from '../../domain/repositories/service-order.repository';

@Injectable()
export class GetServiceOrderUseCase {
  constructor(
    @Inject(ServiceOrderRepository)
    private readonly serviceOrderRepository: ServiceOrderRepository,
  ) {}

  async execute(id: string): Promise<ServiceOrderDetailsResponseDto> {
    const serviceOrder = await this.serviceOrderRepository.findDetailsById(id);

    if (!serviceOrder) {
      throw new NotFoundException('Service order not found.');
    }

    return serviceOrder;
  }
}
