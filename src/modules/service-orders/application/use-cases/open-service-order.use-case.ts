import { randomUUID } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { Customer } from '../../../customers/domain/entities/customer.entity';
import { CustomerRepository } from '../../../customers/domain/repositories/customer.repository';
import { CustomerDocument } from '../../../customers/domain/value-objects/customer-document.value-object';
import { Vehicle } from '../../../vehicles/domain/entities/vehicle.entity';
import { VehicleRepository } from '../../../vehicles/domain/repositories/vehicle.repository';
import { LicensePlate } from '../../../vehicles/domain/value-objects/license-plate.value-object';
import { DomainException } from '../../../../shared/domain/errors/domain.exception';
import { ServiceOrder } from '../../domain/entities/service-order.entity';
import { ServiceOrderRepository } from '../../domain/repositories/service-order.repository';
import { OpenServiceOrderDto } from '../dto/open-service-order.dto';
import { MetricsService } from '../../../../observability/metrics.service';

@Injectable()
export class OpenServiceOrderUseCase {
    constructor(
        @Inject(ServiceOrderRepository)
        private readonly serviceOrderRepository: ServiceOrderRepository,
        @Inject(CustomerRepository)
        private readonly customerRepository: CustomerRepository,
        @Inject(VehicleRepository)
        private readonly vehicleRepository: VehicleRepository,
        private readonly metricsService: MetricsService,
    ) { }

    async execute(input: OpenServiceOrderDto): Promise<{ id: string }> {
        const customer = await this.findOrCreateCustomer(input);
        const vehicle = await this.findOrCreateVehicle(input, customer.id);

        if (vehicle.customerId !== customer.id) {
            throw new DomainException('Vehicle does not belong to the specified customer.');
        }

        const serviceOrder = new ServiceOrder({
            id: randomUUID(),
            customerId: customer.id,
            vehicleId: vehicle.id,
        });

        await this.serviceOrderRepository.create(serviceOrder);
        this.metricsService.recordServiceOrderCreated();

        for (const service of input.services) {
            await this.serviceOrderRepository.addServiceToOrder(
                serviceOrder.id,
                service.serviceId,
                service.quantity,
            );
        }

        for (const stockItem of input.stockItems ?? []) {
            await this.serviceOrderRepository.addStockItemToOrder(
                serviceOrder.id,
                stockItem.stockItemId,
                stockItem.quantity,
            );
        }

        return { id: serviceOrder.id };
    }

    private async findOrCreateCustomer(input: OpenServiceOrderDto): Promise<Customer> {
        const existingCustomer = await this.customerRepository.findByDocument(input.customer.document);

        if (existingCustomer) {
            if (!existingCustomer.isActive) {
                throw new DomainException('Cannot create service order for an inactive customer.');
            }

            return existingCustomer;
        }

        const customer = new Customer({
            id: randomUUID(),
            name: input.customer.name,
            document: new CustomerDocument(input.customer.document, input.customer.documentType),
            phone: input.customer.phone,
            email: input.customer.email,
        });

        await this.customerRepository.create(customer);

        return customer;
    }

    private async findOrCreateVehicle(input: OpenServiceOrderDto, customerId: string): Promise<Vehicle> {
        const licensePlate = new LicensePlate(input.vehicle.licensePlate);
        const existingVehicle = await this.vehicleRepository.findByLicensePlate(licensePlate.value);

        if (existingVehicle) {
            if (!existingVehicle.isActive) {
                throw new DomainException('Cannot create service order for an inactive vehicle.');
            }

            return existingVehicle;
        }

        const vehicle = new Vehicle({
            id: randomUUID(),
            customerId,
            licensePlate,
            brand: input.vehicle.brand,
            model: input.vehicle.model,
            year: input.vehicle.year,
        });

        await this.vehicleRepository.create(vehicle);

        return vehicle;
    }
}
