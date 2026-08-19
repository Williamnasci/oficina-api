import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Min } from 'class-validator';

export class AddServiceToServiceOrderDto {
  @ApiProperty({
    description: 'Service id (UUID)',
    example: '3d2c40cb-21b7-4e0e-84f5-22f5e79b6b12',
  })
  @IsUUID()
  serviceId: string;

  @ApiProperty({
    description: 'Quantity of this service in the service order',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number;
}
