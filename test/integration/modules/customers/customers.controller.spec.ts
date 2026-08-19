import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { CustomersController } from '../../../../src/modules/customers/interfaces/http/controllers/customers.controller';
import { CreateCustomerUseCase } from '../../../../src/modules/customers/application/use-cases/create-customer.use-case';
import { GetCustomerUseCase } from '../../../../src/modules/customers/application/use-cases/get-customer.use-case';
import { ListCustomersUseCase } from '../../../../src/modules/customers/application/use-cases/list-customers.use-case';
import { FindCustomerByDocumentUseCase } from '../../../../src/modules/customers/application/use-cases/find-customer-by-document.use-case';
import { UpdateCustomerUseCase } from '../../../../src/modules/customers/application/use-cases/update-customer.use-case';
import { DeleteCustomerUseCase } from '../../../../src/modules/customers/application/use-cases/delete-customer.use-case';
import { JwtAuthGuard } from '../../../../src/modules/auth/jwt-auth.guard';
import { RolesGuard } from '../../../../src/modules/auth/roles.guard';

describe('CustomersController (integration)', () => {
  let app: INestApplication;

  const mockCustomer = {
    id: 'customer-1',
    name: 'John Doe',
    documentType: 'CPF',
    document: '52998224725',
    phone: '11999999999',
    email: 'john@test.com',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CustomersController],
      providers: [
        {
          provide: CreateCustomerUseCase,
          useValue: {
            execute: jest.fn().mockResolvedValue({ id: 'customer-1' }),
          },
        },
        {
          provide: GetCustomerUseCase,
          useValue: { execute: jest.fn().mockResolvedValue(mockCustomer) },
        },
        {
          provide: ListCustomersUseCase,
          useValue: { execute: jest.fn().mockResolvedValue([mockCustomer]) },
        },
        {
          provide: FindCustomerByDocumentUseCase,
          useValue: { execute: jest.fn().mockResolvedValue(mockCustomer) },
        },
        {
          provide: UpdateCustomerUseCase,
          useValue: { execute: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: DeleteCustomerUseCase,
          useValue: { execute: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /customers should create a customer', async () => {
    await request(app.getHttpServer())
      .post('/customers')
      .send({ name: 'John Doe', document: '52998224725', documentType: 'CPF' })
      .expect(201)
      .expect(({ body }) => {
        expect(body.id).toBe('customer-1');
      });
  });

  it('GET /customers should return list of customers', async () => {
    await request(app.getHttpServer())
      .get('/customers')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toHaveLength(1);
        expect(body[0].name).toBe('John Doe');
      });
  });

  it('GET /customers?document=xxx should return customer by document', async () => {
    await request(app.getHttpServer())
      .get('/customers?document=52998224725')
      .expect(200)
      .expect(({ body }) => {
        expect(body.document).toBe('52998224725');
      });
  });

  it('GET /customers/:id should return a customer', async () => {
    await request(app.getHttpServer())
      .get('/customers/customer-1')
      .expect(200)
      .expect(({ body }) => {
        expect(body.id).toBe('customer-1');
      });
  });

  it('PATCH /customers/:id should return 204', async () => {
    await request(app.getHttpServer())
      .patch('/customers/customer-1')
      .send({ name: 'Jane Doe' })
      .expect(204);
  });

  it('DELETE /customers/:id should return 204', async () => {
    await request(app.getHttpServer())
      .delete('/customers/customer-1')
      .expect(204);
  });
});
