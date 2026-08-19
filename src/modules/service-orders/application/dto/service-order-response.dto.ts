import { ApiProperty } from '@nestjs/swagger';
import { ServiceOrderStatus } from '../../domain/enums/service-order-status.enum';

export class ServiceOrderResponseDto {
  @ApiProperty({
    example: 'e3b5c409-81d7-48df-8caf-627c467b8711',
  })
  id: string;

  @ApiProperty({
    example: '18201d07-08aa-4e2f-ae0e-35a06e0e5e49',
  })
  customerId: string;

  @ApiProperty({
    example: '70af8254-8ffa-42d6-8593-c0a80b2be3a5',
  })
  vehicleId: string;

  @ApiProperty({
    enum: ServiceOrderStatus,
    example: ServiceOrderStatus.RECEIVED,
  })
  status: ServiceOrderStatus;

  @ApiProperty({
    example: 'Brake pad wear identified during inspection.',
    nullable: true,
    required: false,
  })
  diagnosis: string | null;

  @ApiProperty({ example: 0 })
  servicesAmount: number;

  @ApiProperty({ example: 0 })
  stockItemsAmount: number;

  @ApiProperty({ example: 0 })
  totalAmount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ nullable: true, required: false })
  startedAt: Date | null;

  @ApiProperty({ nullable: true, required: false })
  finishedAt: Date | null;

  @ApiProperty({ nullable: true, required: false })
  deliveredAt: Date | null;

  @ApiProperty()
  updatedAt: Date;
}
