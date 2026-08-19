import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Customer } from '../../domain/entities/customer.entity';
import { CustomerRepository } from '../../domain/repositories/customer.repository';
import { CustomerDocument } from '../../domain/value-objects/customer-document.value-object';
import { CustomerDocumentType } from '../../domain/enums/customer-document-type.enum';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { TransactionContext } from '../../../../shared/domain/unit-of-work';

@Injectable()
export class PrismaCustomerRepository implements CustomerRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(customer: Customer, tx?: TransactionContext): Promise<void> {
        const client = (tx as Prisma.TransactionClient | undefined) ?? this.prisma;

        try {
            await client.customer.create({
                data: {
                    id: customer.id,
                    name: customer.name,
                    documentType: customer.document.type,
                    document: customer.document.value,
                    phone: customer.phone,
                    email: customer.email,
                    createdAt: customer.createdAt,
                    updatedAt: customer.updatedAt,
                },
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ConflictException('Document already registered.');
                }
            }

            throw error;
        }
    }

    async findById(id: string): Promise<Customer | null> {
        const data = await this.prisma.customer.findUnique({ where: { id } });

        if (!data) return null;

        return this.toDomain(data);
    }

    async findByDocument(document: string): Promise<Customer | null> {
        const normalizedDocument = document.replace(/\D/g, '');

        const data = await this.prisma.customer.findUnique({
            where: { document: normalizedDocument },
        });

        if (!data) return null;

        return this.toDomain(data);
    }

    async findAll(): Promise<Customer[]> {
        const data = await this.prisma.customer.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return data.map((item) => this.toDomain(item));
    }

    async update(customer: Customer): Promise<void> {
        try {
            await this.prisma.customer.update({
                where: { id: customer.id },
                data: {
                    name: customer.name,
                    phone: customer.phone,
                    email: customer.email,
                    isActive: customer.isActive,
                    updatedAt: customer.updatedAt,
                },
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new NotFoundException('Customer not found.');
                }
            }

            throw error;
        }
    }

    private toDomain(data: {
        id: string;
        name: string;
        document: string;
        documentType: string;
        phone: string | null;
        email: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }): Customer {
        return new Customer({
            id: data.id,
            name: data.name,
            document: CustomerDocument.restore(
                data.document,
                data.documentType as CustomerDocumentType,
            ),
            phone: data.phone,
            email: data.email,
            isActive: data.isActive,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        });
    }
}
