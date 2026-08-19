import { randomUUID } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { Vehicle } from '../../domain/entities/vehicle.entity';
import { VehicleRepository } from '../../domain/repositories/vehicle.repository';
import { LicensePlate } from '../../domain/value-objects/license-plate.value-object';
import { CreateVehicleDto } from '../dto/create-vehicle.dto';

@Injectable()
export class CreateVehicleUseCase {
  constructor(
    @Inject(VehicleRepository)
    private readonly vehicleRepository: VehicleRepository,
  ) {}

  async execute(input: CreateVehicleDto): Promise<{ id: string }> {
    const vehicle = new Vehicle({
      id: randomUUID(),
      customerId: input.customerId,
      licensePlate: new LicensePlate(input.licensePlate),
      brand: input.brand,
      model: input.model,
      year: input.year,
    });

    await this.vehicleRepository.create(vehicle);

    return { id: vehicle.id };
  }
}
