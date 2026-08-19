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
import {
    TransactionContext,
    UnitOfWork,
} from '../../../../shared/domain/unit-of-work';

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
        @Inject(UnitOfWork)
        private readonly unitOfWork: UnitOfWork,
    ) {}

    async execute(input: OpenServiceOrderDto): Promise<{ id: string }> {
        // Cliente, veiculo, OS e cada servico/item de estoque sao escritos em
        // repositorios diferentes (modulos diferentes); sem envolver tudo
        // numa unica transacao, uma falha no meio (ex.: estoque insuficiente
        // no ultimo item) deixava cliente/veiculo/OS parcialmente
        // persistidos, sem rollback. runInTransaction abre uma unica
        // transacao Prisma e repassa o client (tx) para cada repositorio -
        // qualquer excecao no bloco desfaz tudo.
        const serviceOrder = await this.unitOfWork.runInTransaction(async (tx) => {
            const customer = await this.findOrCreateCustomer(input, tx);
            const vehicle = await this.findOrCreateVehicle(input, customer.id, tx);

            if (vehicle.customerId !== customer.id) {
                throw new DomainException(
                    'Vehicle does not belong to the specified customer.',
                );
            }

            const order = new ServiceOrder({
                id: randomUUID(),
                customerId: customer.id,
                vehicleId: vehicle.id,
            });

            await this.serviceOrderRepository.create(order, tx);

            for (const service of input.services) {
                await this.serviceOrderRepository.addServiceToOrder(
                    order.id,
                    service.serviceId,
                    service.quantity,
                    tx,
                );
            }

            for (const stockItem of input.stockItems ?? []) {
                await this.serviceOrderRepository.addStockItemToOrder(
                    order.id,
                    stockItem.stockItemId,
                    stockItem.quantity,
                    tx,
                );
            }

            return order;
        });

        // Fora da transacao, de proposito: so registra a metrica depois do
        // commit - se o bloco acima tivesse sido revertido (rollback), a OS
        // nao existe de verdade e a metrica nao deveria contar como criada.
        this.metricsService.recordServiceOrderCreated();

        return { id: serviceOrder.id };
    }

    private async findOrCreateCustomer(
        input: OpenServiceOrderDto,
        tx: TransactionContext,
    ): Promise<Customer> {
        const existingCustomer = await this.customerRepository.findByDocument(
            input.customer.document,
        );

        if (existingCustomer) {
            if (!existingCustomer.isActive) {
                throw new DomainException(
                    'Cannot create service order for an inactive customer.',
                );
            }

            return existingCustomer;
        }

        const customer = new Customer({
            id: randomUUID(),
            name: input.customer.name,
            document: new CustomerDocument(
                input.customer.document,
                input.customer.documentType,
            ),
            phone: input.customer.phone,
            email: input.customer.email,
        });

        await this.customerRepository.create(customer, tx);

        return customer;
    }

    private async findOrCreateVehicle(
        input: OpenServiceOrderDto,
        customerId: string,
        tx: TransactionContext,
    ): Promise<Vehicle> {
        const licensePlate = new LicensePlate(input.vehicle.licensePlate);
        const existingVehicle = await this.vehicleRepository.findByLicensePlate(
            licensePlate.value,
        );

        if (existingVehicle) {
            if (!existingVehicle.isActive) {
                throw new DomainException(
                    'Cannot create service order for an inactive vehicle.',
                );
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

        await this.vehicleRepository.create(vehicle, tx);

        return vehicle;
    }
}
