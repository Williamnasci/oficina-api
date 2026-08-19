import { ServiceOrder } from '../../domain/entities/service-order.entity';
import { ServiceOrderResponseDto } from '../dto/service-order-response.dto';

export class ServiceOrderMapper {
  static toResponseDto(entity: ServiceOrder): ServiceOrderResponseDto {
    return {
      id: entity.id,
      customerId: entity.customerId,
      vehicleId: entity.vehicleId,
      status: entity.status,
      diagnosis: entity.diagnosis,
      servicesAmount: entity.servicesAmount,
      stockItemsAmount: entity.stockItemsAmount,
      totalAmount: entity.totalAmount,
      createdAt: entity.createdAt,
      startedAt: entity.startedAt,
      finishedAt: entity.finishedAt,
      deliveredAt: entity.deliveredAt,
      updatedAt: entity.updatedAt,
    };
  }
}
