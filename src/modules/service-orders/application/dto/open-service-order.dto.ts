import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerDocumentType } from '../../../customers/domain/enums/customer-document-type.enum';

class OpenServiceOrderCustomerDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name!: string;

  @ApiProperty({
    enum: CustomerDocumentType,
    example: CustomerDocumentType.CPF,
  })
  @IsEnum(CustomerDocumentType)
  documentType!: CustomerDocumentType;

  @ApiProperty({ example: '52998224725' })
  @IsString()
  document!: string;

  @ApiPropertyOptional({ example: '11999999999' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;
}

class OpenServiceOrderVehicleDto {
  @ApiProperty({ example: 'ABC1D23' })
  @IsString()
  licensePlate!: string;

  @ApiProperty({ example: 'Toyota' })
  @IsString()
  brand!: string;

  @ApiProperty({ example: 'Corolla' })
  @IsString()
  model!: string;

  @ApiProperty({ example: 2022 })
  @IsInt()
  @Min(1900)
  year!: number;
}

class OpenServiceOrderServiceDto {
  @ApiProperty({ example: '88ef38db-e956-4e26-807e-e709b87c25af' })
  @IsString()
  serviceId!: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  quantity!: number;
}

class OpenServiceOrderStockItemDto {
  @ApiProperty({ example: '90a44f7f-6798-44f8-8c23-d6d20dcd4ed0' })
  @IsString()
  stockItemId!: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class OpenServiceOrderDto {
  @ApiProperty({ type: OpenServiceOrderCustomerDto })
  @ValidateNested()
  @Type(() => OpenServiceOrderCustomerDto)
  customer!: OpenServiceOrderCustomerDto;

  @ApiProperty({ type: OpenServiceOrderVehicleDto })
  @ValidateNested()
  @Type(() => OpenServiceOrderVehicleDto)
  vehicle!: OpenServiceOrderVehicleDto;

  @ApiProperty({ type: [OpenServiceOrderServiceDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OpenServiceOrderServiceDto)
  services!: OpenServiceOrderServiceDto[];

  @ApiPropertyOptional({ type: [OpenServiceOrderStockItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OpenServiceOrderStockItemDto)
  stockItems?: OpenServiceOrderStockItemDto[];
}
