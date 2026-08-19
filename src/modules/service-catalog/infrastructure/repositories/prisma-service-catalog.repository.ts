import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { ServiceCatalog } from '../../domain/entities/service-catalog.entity';
import { ServiceCatalogRepository } from '../../domain/repositories/service-catalog.repository';

@Injectable()
export class PrismaServiceCatalogRepository implements ServiceCatalogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(service: ServiceCatalog): Promise<void> {
    await this.prisma.serviceCatalog.create({
      data: {
        id: service.id,
        name: service.name,
        description: service.description,
        price: service.price,
        isActive: service.isActive,
        createdAt: service.createdAt,
        updatedAt: service.updatedAt,
      },
    });
  }

  async findById(id: string): Promise<ServiceCatalog | null> {
    const data = await this.prisma.serviceCatalog.findUnique({ where: { id } });

    if (!data) return null;

    return new ServiceCatalog({
      id: data.id,
      name: data.name,
      description: data.description,
      price: Number(data.price),
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  async findAll(onlyActive = true): Promise<ServiceCatalog[]> {
    const data = await this.prisma.serviceCatalog.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return data.map(
      (item) =>
        new ServiceCatalog({
          id: item.id,
          name: item.name,
          description: item.description,
          price: Number(item.price),
          isActive: item.isActive,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        }),
    );
  }

  async update(service: ServiceCatalog): Promise<void> {
    try {
      await this.prisma.serviceCatalog.update({
        where: { id: service.id },
        data: {
          name: service.name,
          description: service.description,
          price: service.price,
          isActive: service.isActive,
          updatedAt: service.updatedAt,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Service not found.');
        }
      }

      throw error;
    }
  }
}
