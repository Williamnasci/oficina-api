import { ApiProperty } from '@nestjs/swagger';
import { ServiceOrderStatus } from '../../domain/enums/service-order-status.enum';

export class ServiceOrderStatusResponseDto {
  @ApiProperty({ example: 'e3b5c409-81d7-48df-8caf-627c467b8711' })
  id!: string;

  @ApiProperty({
    enum: ServiceOrderStatus,
    example: ServiceOrderStatus.RECEIVED,
  })
  status!: ServiceOrderStatus;

  @ApiProperty({ example: 'Recebida' })
  statusLabel!: string;

  @ApiProperty()
  updatedAt!: Date;
}
