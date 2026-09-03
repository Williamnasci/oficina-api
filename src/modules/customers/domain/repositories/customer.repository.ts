import { Customer } from '../entities/customer.entity';
import { TransactionContext } from '../../../../shared/domain/unit-of-work';

export abstract class CustomerRepository {
  abstract create(customer: Customer, tx?: TransactionContext): Promise<void>;
  abstract findById(id: string): Promise<Customer | null>;
  abstract findByDocument(document: string): Promise<Customer | null>;
  abstract findAll(): Promise<Customer[]>;
  abstract update(customer: Customer): Promise<void>;
}
