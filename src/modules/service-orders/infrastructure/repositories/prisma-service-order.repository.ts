import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { ServiceOrder } from '../../domain/entities/service-order.entity';
import { ServiceOrderStatus } from '../../domain/enums/service-order-status.enum';
import { ServiceOrderRepository } from '../../domain/repositories/service-order.repository';
import { ServiceOrderDetailsReadModel } from '../../domain/repositories/service-order-details.read-model';

@Injectable()
export class PrismaServiceOrderRepository implements ServiceOrderRepository {
    constructor(private readonly prisma: PrismaService) { }

    async create(order: ServiceOrder): Promise<void> {
        try {
            await this.prisma.serviceOrder.create({
                data: {
                    id: order.id,
                    customerId: order.customerId,
                    vehicleId: order.vehicleId,
                    status: order.status,
                    diagnosis: order.diagnosis,
                    servicesAmount: order.servicesAmount,
                    stockItemsAmount: order.stockItemsAmount,
                    totalAmount: order.totalAmount,
                    createdAt: order.createdAt,
                    startedAt: order.startedAt,
                    finishedAt: order.finishedAt,
                    deliveredAt: order.deliveredAt,
                    updatedAt: order.updatedAt,
                },
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2003') {
                    throw new NotFoundException('Customer or vehicle not found.');
                }
            }

            throw error;
        }
    }

    async findById(id: string): Promise<ServiceOrder | null> {
        const data = await this.prisma.serviceOrder.findUnique({ where: { id } });

        if (!data) return null;

        return this.toDomain(data);
    }

    async findAll(): Promise<ServiceOrder[]> {
        const data = await this.prisma.serviceOrder.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return data.map((item) => this.toDomain(item));
    }

    async findOperationalQueue(): Promise<ServiceOrder[]> {
        const priority: Record<ServiceOrderStatus, number> = {
            [ServiceOrderStatus.IN_PROGRESS]: 0,
            [ServiceOrderStatus.APPROVED]: 1,
            [ServiceOrderStatus.WAITING_APPROVAL]: 2,
            [ServiceOrderStatus.IN_DIAGNOSIS]: 3,
            [ServiceOrderStatus.RECEIVED]: 4,
            [ServiceOrderStatus.FINISHED]: 5,
            [ServiceOrderStatus.DELIVERED]: 6,
        };

        const data = await this.prisma.serviceOrder.findMany({
            where: {
                status: {
                    in: [
                        ServiceOrderStatus.IN_PROGRESS,
                        ServiceOrderStatus.APPROVED,
                        ServiceOrderStatus.WAITING_APPROVAL,
                        ServiceOrderStatus.IN_DIAGNOSIS,
                        ServiceOrderStatus.RECEIVED,
                    ],
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        return data
            .map((item) => this.toDomain(item))
            .sort((left, right) => {
                const statusDiff = priority[left.status] - priority[right.status];

                if (statusDiff !== 0) return statusDiff;

                return left.createdAt.getTime() - right.createdAt.getTime();
            });
    }

    async findByCustomerId(customerId: string): Promise<ServiceOrder[]> {
        const data = await this.prisma.serviceOrder.findMany({
            where: { customerId },
            orderBy: { createdAt: 'desc' },
        });

        return data.map((item) => this.toDomain(item));
    }

    async getAverageExecutionTimeInMinutes(): Promise<number> {
        const finishedOrders = await this.prisma.serviceOrder.findMany({
            where: {
                startedAt: { not: null },
                finishedAt: { not: null },
            },
            select: {
                startedAt: true,
                finishedAt: true,
            },
        });

        if (finishedOrders.length === 0) {
            return 0;
        }

        const totalMinutes = finishedOrders.reduce((sum, order) => {
            const startedAt = order.startedAt as Date;
            const finishedAt = order.finishedAt as Date;
            const diffInMinutes = Math.max(
                0,
                Math.round((finishedAt.getTime() - startedAt.getTime()) / 60000),
            );

            return sum + diffInMinutes;
        }, 0);

        return Math.round(totalMinutes / finishedOrders.length);
    }

    async update(order: ServiceOrder): Promise<void> {
        try {
            await this.prisma.serviceOrder.update({
                where: { id: order.id },
                data: {
                    status: order.status,
                    diagnosis: order.diagnosis,
                    servicesAmount: order.servicesAmount,
                    stockItemsAmount: order.stockItemsAmount,
                    totalAmount: order.totalAmount,
                    startedAt: order.startedAt,
                    finishedAt: order.finishedAt,
                    deliveredAt: order.deliveredAt,
                    updatedAt: order.updatedAt,
                },
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new NotFoundException('Service order not found.');
                }
            }

            throw error;
        }
    }

    async addServiceToOrder(serviceOrderId: string, serviceId: string, quantity: number): Promise<void> {
        await this.prisma.$transaction(async (tx) => {
            const order = await tx.serviceOrder.findUnique({
                where: { id: serviceOrderId },
            });

            if (!order) {
                throw new NotFoundException('Service order not found.');
            }

            const service = await tx.serviceCatalog.findUnique({
                where: { id: serviceId },
            });

            if (!service || !service.isActive) {
                throw new NotFoundException('Service not found.');
            }

            const existingItem = await tx.serviceOrderService.findFirst({
                where: {
                    serviceOrderId,
                    serviceId,
                },
            });

            const unitPrice = Number(service.price);

            if (existingItem) {
                const newQuantity = existingItem.quantity + quantity;
                const newTotalPrice = unitPrice * newQuantity;

                await tx.serviceOrderService.update({
                    where: { id: existingItem.id },
                    data: {
                        quantity: newQuantity,
                        unitPrice,
                        totalPrice: newTotalPrice,
                    },
                });
            } else {
                await tx.serviceOrderService.create({
                    data: {
                        serviceOrderId,
                        serviceId,
                        quantity,
                        unitPrice,
                        totalPrice: unitPrice * quantity,
                    },
                });
            }

            const serviceItems = await tx.serviceOrderService.findMany({
                where: { serviceOrderId },
            });

            const servicesAmount = serviceItems.reduce(
                (sum, item) => sum + Number(item.totalPrice),
                0,
            );

            // Use domain entity for recalculation
            const domainOrder = this.toDomain(order);
            domainOrder.updateServicesAmount(servicesAmount);

            await tx.serviceOrder.update({
                where: { id: serviceOrderId },
                data: {
                    servicesAmount: domainOrder.servicesAmount,
                    totalAmount: domainOrder.totalAmount,
                    updatedAt: domainOrder.updatedAt,
                },
            });
        });
    }

    async findDetailsById(id: string): Promise<ServiceOrderDetailsReadModel | null> {
        const data = await this.prisma.serviceOrder.findUnique({
            where: { id },
            include: {
                services: {
                    include: {
                        service: true,
                    },
                },
                stockItems: {
                    include: {
                        stockItem: true,
                    },
                },
            },
        });

        if (!data) return null;

        return {
            id: data.id,
            customerId: data.customerId,
            vehicleId: data.vehicleId,
            status: data.status as ServiceOrderStatus,
            diagnosis: data.diagnosis,
            servicesAmount: Number(data.servicesAmount),
            stockItemsAmount: Number(data.stockItemsAmount),
            totalAmount: Number(data.totalAmount),
            createdAt: data.createdAt,
            startedAt: data.startedAt,
            finishedAt: data.finishedAt,
            deliveredAt: data.deliveredAt,
            updatedAt: data.updatedAt,
            services: data.services.map((item) => ({
                id: item.id,
                serviceId: item.serviceId,
                name: item.service.name,
                quantity: item.quantity,
                unitPrice: Number(item.unitPrice),
                totalPrice: Number(item.totalPrice),
            })),
            stockItems: data.stockItems.map((item) => ({
                id: item.id,
                stockItemId: item.stockItemId,
                name: item.stockItem.name,
                quantity: item.quantity,
                unitPrice: Number(item.unitPrice),
                totalPrice: Number(item.totalPrice),
            })),
        };
    }

    async addStockItemToOrder(serviceOrderId: string, stockItemId: string, quantity: number): Promise<void> {
        await this.prisma.$transaction(async (tx) => {
            const order = await tx.serviceOrder.findUnique({
                where: { id: serviceOrderId },
            });

            if (!order) {
                throw new NotFoundException('Service order not found.');
            }

            const stockItem = await tx.stockItem.findUnique({
                where: { id: stockItemId },
            });

            if (!stockItem || !stockItem.isActive) {
                throw new NotFoundException('Stock item not found.');
            }

            // Decremento condicional atomico: a checagem de quantidade e a
            // escrita acontecem na MESMA instrucao SQL (UPDATE ... WHERE
            // quantity >= X), com lock de linha do Postgres. O findUnique
            // acima e so pra dar um erro 404 cedo com uma mensagem melhor -
            // ele NAO e a fonte de verdade da checagem de disponibilidade
            // (duas transacoes concorrentes podiam ler o mesmo valor antes
            // de qualquer uma escrever, permitindo overselling).
            const decremented = await tx.stockItem.updateMany({
                where: { id: stockItemId, quantity: { gte: quantity } },
                data: { quantity: { decrement: quantity }, updatedAt: new Date() },
            });

            if (decremented.count === 0) {
                throw new ConflictException('Insufficient stock quantity.');
            }

            const unitPrice = Number(stockItem.unitPrice);

            // upsert (nao findFirst + create/update) porque a constraint
            // unique(serviceOrderId, stockItemId) faz o Postgres resolver a
            // corrida via ON CONFLICT - duas requisicoes concorrentes
            // adicionando o mesmo item nao criam mais duas linhas.
            await tx.serviceOrderStockItem.upsert({
                where: {
                    serviceOrderId_stockItemId: { serviceOrderId, stockItemId },
                },
                create: {
                    serviceOrderId,
                    stockItemId,
                    quantity,
                    unitPrice,
                    totalPrice: unitPrice * quantity,
                },
                update: {
                    quantity: { increment: quantity },
                    unitPrice,
                    totalPrice: { increment: unitPrice * quantity },
                },
            });

            const stockItems = await tx.serviceOrderStockItem.findMany({
                where: { serviceOrderId },
            });

            const stockItemsAmount = stockItems.reduce(
                (sum, item) => sum + Number(item.totalPrice),
                0,
            );

            // Use domain entity for recalculation
            const domainOrder = this.toDomain(order);
            domainOrder.updateStockItemsAmount(stockItemsAmount);

            await tx.serviceOrder.update({
                where: { id: serviceOrderId },
                data: {
                    stockItemsAmount: domainOrder.stockItemsAmount,
                    totalAmount: domainOrder.totalAmount,
                    updatedAt: domainOrder.updatedAt,
                },
            });
        });
    }

    private toDomain(data: {
        id: string;
        customerId: string;
        vehicleId: string;
        status: string;
        diagnosis: string | null;
        servicesAmount: Prisma.Decimal | number;
        stockItemsAmount: Prisma.Decimal | number;
        totalAmount: Prisma.Decimal | number;
        createdAt: Date;
        startedAt: Date | null;
        finishedAt: Date | null;
        deliveredAt: Date | null;
        updatedAt: Date;
    }): ServiceOrder {
        return new ServiceOrder({
            id: data.id,
            customerId: data.customerId,
            vehicleId: data.vehicleId,
            status: data.status as ServiceOrderStatus,
            diagnosis: data.diagnosis,
            servicesAmount: Number(data.servicesAmount),
            stockItemsAmount: Number(data.stockItemsAmount),
            totalAmount: Number(data.totalAmount),
            createdAt: data.createdAt,
            startedAt: data.startedAt,
            finishedAt: data.finishedAt,
            deliveredAt: data.deliveredAt,
            updatedAt: data.updatedAt,
        });
    }
}
