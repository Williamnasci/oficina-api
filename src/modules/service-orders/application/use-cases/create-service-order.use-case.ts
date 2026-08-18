import { randomUUID } from 'crypto';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ServiceOrder } from '../../domain/entities/service-order.entity';
import { ServiceOrderRepository } from '../../domain/repositories/service-order.repository';
import { CustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import { VehicleRepository } from '../../../vehicles/domain/repositories/vehicle.repository';
import { CreateServiceOrderDto } from '../dto/create-service-order.dto';
import { DomainException } from '../../../../shared/domain/errors/domain.exception';
import { MetricsService } from '../../../../observability/metrics.service';

@Injectable()
export class CreateServiceOrderUseCase {
    constructor(
        @Inject(ServiceOrderRepository)
        private readonly serviceOrderRepository: ServiceOrderRepository,
        @Inject(CustomerRepository)
        private readonly customerRepository: CustomerRepository,
        @Inject(VehicleRepository)
        private readonly vehicleRepository: VehicleRepository,
        private readonly metricsService: MetricsService,
    ) { }

    async execute(input: CreateServiceOrderDto): Promise<{ id: string }> {
        if (!input.customerId && !input.customerDocument) {
            throw new DomainException('Customer id or document is required.');
        }

        const customer = input.customerDocument
            ? await this.customerRepository.findByDocument(input.customerDocument)
            : await this.customerRepository.findById(input.customerId as string);

        if (!customer) {
            throw new NotFoundException('Customer not found.');
        }

        if (!customer.isActive) {
            throw new DomainException('Cannot create service order for an inactive customer.');
        }

        const vehicle = await this.vehicleRepository.findById(input.vehicleId);

        if (!vehicle) {
            throw new NotFoundException('Vehicle not found.');
        }

        if (!vehicle.isActive) {
            throw new DomainException('Cannot create service order for an inactive vehicle.');
        }

        if (vehicle.customerId !== customer.id) {
            throw new DomainException('Vehicle does not belong to the specified customer.');
        }

        const serviceOrder = new ServiceOrder({
            id: randomUUID(),
            customerId: customer.id,
            vehicleId: input.vehicleId,
        });

        await this.serviceOrderRepository.create(serviceOrder);
        this.metricsService.recordServiceOrderCreated();

        return { id: serviceOrder.id };
    }
}
