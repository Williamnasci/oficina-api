import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import { ServiceOrderRepository } from '../../domain/repositories/service-order.repository';
import { ServiceOrderDetailsResponseDto } from '../dto/service-order-details-response.dto';

@Injectable()
export class FindServiceOrdersByDocumentUseCase {
  constructor(
    @Inject(ServiceOrderRepository)
    private readonly serviceOrderRepository: ServiceOrderRepository,
    @Inject(CustomerRepository)
    private readonly customerRepository: CustomerRepository,
  ) {}

  async execute(document: string): Promise<ServiceOrderDetailsResponseDto[]> {
    const customer = await this.customerRepository.findByDocument(document);

    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    const serviceOrders = await this.serviceOrderRepository.findByCustomerId(
      customer.id,
    );

    const details: ServiceOrderDetailsResponseDto[] = [];

    for (const order of serviceOrders) {
      const detail = await this.serviceOrderRepository.findDetailsById(
        order.id,
      );
      if (detail) {
        details.push(detail);
      }
    }

    return details;
  }
}
