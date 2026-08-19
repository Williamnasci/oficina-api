import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { Vehicle } from '../../domain/entities/vehicle.entity';
import { VehicleRepository } from '../../domain/repositories/vehicle.repository';
import { LicensePlate } from '../../domain/value-objects/license-plate.value-object';
import { TransactionContext } from '../../../../shared/domain/unit-of-work';

@Injectable()
export class PrismaVehicleRepository implements VehicleRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(vehicle: Vehicle, tx?: TransactionContext): Promise<void> {
        const client = (tx as Prisma.TransactionClient | undefined) ?? this.prisma;

        try {
            await client.vehicle.create({
                data: {
                    id: vehicle.id,
                    customerId: vehicle.customerId,
                    licensePlate: vehicle.licensePlate.value,
                    brand: vehicle.brand,
                    model: vehicle.model,
                    year: vehicle.year,
                    createdAt: vehicle.createdAt,
                    updatedAt: vehicle.updatedAt,
                },
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ConflictException('License plate already registered.');
                }

                if (error.code === 'P2003') {
                    throw new NotFoundException('Customer not found.');
                }
            }

            throw error;
        }
    }

    async findById(id: string): Promise<Vehicle | null> {
        const data = await this.prisma.vehicle.findUnique({ where: { id } });

        if (!data) return null;

        return this.toDomain(data);
    }

    async findByLicensePlate(licensePlate: string): Promise<Vehicle | null> {
        const normalizedPlate = licensePlate
            .replace(/[^a-zA-Z0-9]/g, '')
            .toUpperCase();

        const data = await this.prisma.vehicle.findUnique({
            where: { licensePlate: normalizedPlate },
        });

        if (!data) return null;

        return this.toDomain(data);
    }

    async findAll(): Promise<Vehicle[]> {
        const data = await this.prisma.vehicle.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return data.map((item) => this.toDomain(item));
    }

    async findByCustomerId(customerId: string): Promise<Vehicle[]> {
        const data = await this.prisma.vehicle.findMany({
            where: { customerId },
            orderBy: { createdAt: 'desc' },
        });

        return data.map((item) => this.toDomain(item));
    }

    async update(vehicle: Vehicle): Promise<void> {
        try {
            await this.prisma.vehicle.update({
                where: { id: vehicle.id },
                data: {
                    brand: vehicle.brand,
                    model: vehicle.model,
                    year: vehicle.year,
                    isActive: vehicle.isActive,
                    updatedAt: vehicle.updatedAt,
                },
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new NotFoundException('Vehicle not found.');
                }
            }

            throw error;
        }
    }

    private toDomain(data: {
        id: string;
        customerId: string;
        licensePlate: string;
        brand: string;
        model: string;
        year: number;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }): Vehicle {
        return new Vehicle({
            id: data.id,
            customerId: data.customerId,
            licensePlate: new LicensePlate(data.licensePlate),
            brand: data.brand,
            model: data.model,
            year: data.year,
            isActive: data.isActive,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        });
    }
}
