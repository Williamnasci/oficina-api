import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { VehiclesController } from '../../../../src/modules/vehicles/interfaces/http/controllers/vehicles.controller';
import { CreateVehicleUseCase } from '../../../../src/modules/vehicles/application/use-cases/create-vehicle.use-case';
import { GetVehicleUseCase } from '../../../../src/modules/vehicles/application/use-cases/get-vehicle.use-case';
import { ListVehiclesUseCase } from '../../../../src/modules/vehicles/application/use-cases/list-vehicles.use-case';
import { UpdateVehicleUseCase } from '../../../../src/modules/vehicles/application/use-cases/update-vehicle.use-case';
import { DeleteVehicleUseCase } from '../../../../src/modules/vehicles/application/use-cases/delete-vehicle.use-case';
import { JwtAuthGuard } from '../../../../src/modules/auth/jwt-auth.guard';
import { RolesGuard } from '../../../../src/modules/auth/roles.guard';

describe('VehiclesController (integration)', () => {
  let app: INestApplication;

  const mockVehicle = {
    id: 'vehicle-1',
    customerId: 'customer-1',
    licensePlate: 'ABC1234',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2022,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [VehiclesController],
      providers: [
        {
          provide: CreateVehicleUseCase,
          useValue: {
            execute: jest.fn().mockResolvedValue({ id: 'vehicle-1' }),
          },
        },
        {
          provide: GetVehicleUseCase,
          useValue: { execute: jest.fn().mockResolvedValue(mockVehicle) },
        },
        {
          provide: ListVehiclesUseCase,
          useValue: { execute: jest.fn().mockResolvedValue([mockVehicle]) },
        },
        {
          provide: UpdateVehicleUseCase,
          useValue: { execute: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: DeleteVehicleUseCase,
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

  it('POST /vehicles should create a vehicle', async () => {
    await request(app.getHttpServer())
      .post('/vehicles')
      .send({
        customerId: '18201d07-08aa-4e2f-ae0e-35a06e0e5e49',
        licensePlate: 'ABC1234',
        brand: 'Toyota',
        model: 'Corolla',
        year: 2022,
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.id).toBe('vehicle-1');
      });
  });

  it('GET /vehicles should return list of vehicles', async () => {
    await request(app.getHttpServer())
      .get('/vehicles')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toHaveLength(1);
        expect(body[0].brand).toBe('Toyota');
      });
  });

  it('GET /vehicles/:id should return a vehicle', async () => {
    await request(app.getHttpServer())
      .get('/vehicles/vehicle-1')
      .expect(200)
      .expect(({ body }) => {
        expect(body.id).toBe('vehicle-1');
      });
  });

  it('PATCH /vehicles/:id should return 204', async () => {
    await request(app.getHttpServer())
      .patch('/vehicles/vehicle-1')
      .send({ brand: 'Honda' })
      .expect(204);
  });

  it('DELETE /vehicles/:id should return 204', async () => {
    await request(app.getHttpServer())
      .delete('/vehicles/vehicle-1')
      .expect(204);
  });
});
