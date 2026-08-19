import { Module } from '@nestjs/common';
import { CreateVehicleUseCase } from './application/use-cases/create-vehicle.use-case';
import { GetVehicleUseCase } from './application/use-cases/get-vehicle.use-case';
import { ListVehiclesUseCase } from './application/use-cases/list-vehicles.use-case';
import { UpdateVehicleUseCase } from './application/use-cases/update-vehicle.use-case';
import { DeleteVehicleUseCase } from './application/use-cases/delete-vehicle.use-case';
import { VehicleRepository } from './domain/repositories/vehicle.repository';
import { PrismaVehicleRepository } from './infrastructure/repositories/prisma-vehicle.repository';
import { VehiclesController } from './interfaces/http/controllers/vehicles.controller';

@Module({
  controllers: [VehiclesController],
  providers: [
    CreateVehicleUseCase,
    GetVehicleUseCase,
    ListVehiclesUseCase,
    UpdateVehicleUseCase,
    DeleteVehicleUseCase,
    {
      provide: VehicleRepository,
      useClass: PrismaVehicleRepository,
    },
  ],
  exports: [VehicleRepository],
})
export class VehiclesModule {}
