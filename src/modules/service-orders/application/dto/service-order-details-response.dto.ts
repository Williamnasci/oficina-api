import { ApiProperty } from '@nestjs/swagger';
import { ServiceOrderStatus } from '../../domain/enums/service-order-status.enum';

class ServiceOrderServiceItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  serviceId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unitPrice: number;

  @ApiProperty()
  totalPrice: number;
}

class ServiceOrderStockItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  stockItemId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unitPrice: number;

  @ApiProperty()
  totalPrice: number;
}

export class ServiceOrderDetailsResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  customerId: string;

  @ApiProperty()
  vehicleId: string;

  @ApiProperty({ enum: ServiceOrderStatus })
  status: ServiceOrderStatus;

  @ApiProperty({ nullable: true })
  diagnosis: string | null;

  @ApiProperty()
  servicesAmount: number;

  @ApiProperty()
  stockItemsAmount: number;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ nullable: true })
  startedAt: Date | null;

  @ApiProperty({ nullable: true })
  finishedAt: Date | null;

  @ApiProperty({ nullable: true })
  deliveredAt: Date | null;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: [ServiceOrderServiceItemResponseDto] })
  services: ServiceOrderServiceItemResponseDto[];

  @ApiProperty({ type: [ServiceOrderStockItemResponseDto] })
  stockItems: ServiceOrderStockItemResponseDto[];
}
