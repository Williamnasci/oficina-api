import { Customer } from '../entities/customer.entity';
import { TransactionContext } from '../../../../shared/domain/unit-of-work';

export abstract class CustomerRepository {
  // tx opcional: quando fornecido (via UnitOfWork.runInTransaction), a
  // escrita participa da transacao do chamador em vez de abrir a sua
  // propria - usado por fluxos que precisam ser atomicos com escritas de
  // outros repositorios (ex.: OpenServiceOrderUseCase).
  abstract create(customer: Customer, tx?: TransactionContext): Promise<void>;
  abstract findById(id: string): Promise<Customer | null>;
  abstract findByDocument(document: string): Promise<Customer | null>;
  abstract findAll(): Promise<Customer[]>;
  abstract update(customer: Customer): Promise<void>;
}
