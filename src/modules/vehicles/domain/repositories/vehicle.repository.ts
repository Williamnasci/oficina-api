import { Vehicle } from '../entities/vehicle.entity';
import { TransactionContext } from '../../../../shared/domain/unit-of-work';

export abstract class VehicleRepository {
    // tx opcional: ver comentario equivalente em CustomerRepository.
    abstract create(vehicle: Vehicle, tx?: TransactionContext): Promise<void>;
    abstract findById(id: string): Promise<Vehicle | null>;
    abstract findByLicensePlate(licensePlate: string): Promise<Vehicle | null>;
    abstract findAll(): Promise<Vehicle[]>;
    abstract findByCustomerId(customerId: string): Promise<Vehicle[]>;
    abstract update(vehicle: Vehicle): Promise<void>;
}
