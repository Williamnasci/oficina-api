import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Min } from 'class-validator';

export class AddStockItemToServiceOrderDto {
  @ApiProperty({
    description: 'Stock item id (UUID)',
    example: 'c0f6d9b0-6d8a-4e0f-a0b0-3d4b9f6c2a11',
  })
  @IsUUID()
  stockItemId: string;

  @ApiProperty({
    description: 'Quantity of stock item to add to the service order',
    example: 2,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number;
}
