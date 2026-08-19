import { randomUUID } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { Customer } from '../../domain/entities/customer.entity';
import { CustomerRepository } from '../../domain/repositories/customer.repository';
import { CustomerDocument } from '../../domain/value-objects/customer-document.value-object';
import { CreateCustomerDto } from '../dto/create-customer.dto';

@Injectable()
export class CreateCustomerUseCase {
  constructor(
    @Inject(CustomerRepository)
    private readonly customerRepository: CustomerRepository,
  ) {}

  async execute(input: CreateCustomerDto): Promise<{ id: string }> {
    const customer = new Customer({
      id: randomUUID(),
      name: input.name,
      document: new CustomerDocument(input.document, input.documentType),
      phone: input.phone,
      email: input.email,
    });

    await this.customerRepository.create(customer);

    return { id: customer.id };
  }
}
