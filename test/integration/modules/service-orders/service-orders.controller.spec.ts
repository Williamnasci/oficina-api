import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ServiceOrdersController } from '../../../../src/modules/service-orders/interfaces/http/controllers/service-orders.controller';
import { CreateServiceOrderUseCase } from '../../../../src/modules/service-orders/application/use-cases/create-service-order.use-case';
import { GetServiceOrderUseCase } from '../../../../src/modules/service-orders/application/use-cases/get-service-order.use-case';
import { RegisterDiagnosisUseCase } from '../../../../src/modules/service-orders/application/use-cases/register-diagnosis.use-case';
import { SendBudgetForApprovalUseCase } from '../../../../src/modules/service-orders/application/use-cases/send-budget-for-approval.use-case';
import { StartServiceOrderExecutionUseCase } from '../../../../src/modules/service-orders/application/use-cases/start-service-order-execution.use-case';
import { FinishServiceOrderUseCase } from '../../../../src/modules/service-orders/application/use-cases/finish-service-order.use-case';
import { DeliverServiceOrderUseCase } from '../../../../src/modules/service-orders/application/use-cases/deliver-service-order.use-case';
import { AddServiceToServiceOrderUseCase } from '../../../../src/modules/service-orders/application/use-cases/add-service-to-service-order.use-case';
import { AddStockItemToServiceOrderUseCase } from '../../../../src/modules/service-orders/application/use-cases/add-stock-item-to-service-order.use-case';
import { ApproveBudgetUseCase } from '../../../../src/modules/service-orders/application/use-cases/approve-budget.use-case';
import { FindServiceOrdersByDocumentUseCase } from '../../../../src/modules/service-orders/application/use-cases/find-service-orders-by-document.use-case';
import { GetAverageExecutionTimeUseCase } from '../../../../src/modules/service-orders/application/use-cases/get-average-execution-time.use-case';
import { GetServiceOrderStatusUseCase } from '../../../../src/modules/service-orders/application/use-cases/get-service-order-status.use-case';
import { HandleBudgetDecisionUseCase } from '../../../../src/modules/service-orders/application/use-cases/handle-budget-decision.use-case';
import { ListOperationalServiceOrdersUseCase } from '../../../../src/modules/service-orders/application/use-cases/list-operational-service-orders.use-case';
import { ListServiceOrdersUseCase } from '../../../../src/modules/service-orders/application/use-cases/list-service-orders.use-case';
import { OpenServiceOrderUseCase } from '../../../../src/modules/service-orders/application/use-cases/open-service-order.use-case';
import { JwtAuthGuard } from '../../../../src/modules/auth/jwt-auth.guard';
import { RolesGuard } from '../../../../src/modules/auth/roles.guard';

describe('ServiceOrdersController (integration)', () => {
    let app: INestApplication;

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            controllers: [ServiceOrdersController],
            providers: [
                { provide: CreateServiceOrderUseCase, useValue: { execute: jest.fn().mockResolvedValue({ id: 'service-order-1' }) } },
                {
                    provide: GetServiceOrderUseCase, useValue: {
                        execute: jest.fn().mockResolvedValue({
                            id: 'service-order-1',
                            customerId: 'customer-1',
                            vehicleId: 'vehicle-1',
                            status: 'RECEIVED',
                            diagnosis: null,
                            servicesAmount: 150,
                            stockItemsAmount: 400,
                            totalAmount: 550,
                            createdAt: new Date(),
                            startedAt: null,
                            finishedAt: null,
                            deliveredAt: null,
                            updatedAt: new Date(),
                            services: [
                                {
                                    id: 'item-1',
                                    serviceId: 'service-1',
                                    name: 'Troca de óleo',
                                    quantity: 1,
                                    unitPrice: 150,
                                    totalPrice: 150,
                                },
                            ],
                            stockItems: [
                                {
                                    id: 'item-2',
                                    stockItemId: 'stock-1',
                                    name: 'Pastilha de freio',
                                    quantity: 2,
                                    unitPrice: 200,
                                    totalPrice: 400,
                                },
                            ],
                        })
                    }
                },
                { provide: RegisterDiagnosisUseCase, useValue: { execute: jest.fn().mockResolvedValue(undefined) } },
                { provide: SendBudgetForApprovalUseCase, useValue: { execute: jest.fn().mockResolvedValue(undefined) } },
                { provide: StartServiceOrderExecutionUseCase, useValue: { execute: jest.fn().mockResolvedValue(undefined) } },
                { provide: FinishServiceOrderUseCase, useValue: { execute: jest.fn().mockResolvedValue(undefined) } },
                { provide: DeliverServiceOrderUseCase, useValue: { execute: jest.fn().mockResolvedValue(undefined) } },
                { provide: AddServiceToServiceOrderUseCase, useValue: { execute: jest.fn().mockResolvedValue(undefined) } },
                { provide: AddStockItemToServiceOrderUseCase, useValue: { execute: jest.fn().mockResolvedValue(undefined) } },
                { provide: ApproveBudgetUseCase, useValue: { execute: jest.fn().mockResolvedValue(undefined) } },
                { provide: FindServiceOrdersByDocumentUseCase, useValue: { execute: jest.fn().mockResolvedValue([]) } },
                {
                    provide: GetAverageExecutionTimeUseCase,
                    useValue: {
                        execute: jest.fn().mockResolvedValue({
                            averageExecutionTimeInMinutes: 150,
                            averageExecutionTimeFormatted: '2h 30m',
                        }),
                    },
                },
                {
                    provide: GetServiceOrderStatusUseCase,
                    useValue: {
                        execute: jest.fn().mockResolvedValue({
                            id: 'service-order-1',
                            status: 'RECEIVED',
                            statusLabel: 'Recebida',
                            updatedAt: new Date(),
                        }),
                    },
                },
                { provide: HandleBudgetDecisionUseCase, useValue: { execute: jest.fn().mockResolvedValue(undefined) } },
                {
                    provide: ListServiceOrdersUseCase,
                    useValue: {
                        execute: jest.fn().mockResolvedValue([
                            {
                                id: 'service-order-1',
                                customerId: 'customer-1',
                                vehicleId: 'vehicle-1',
                                status: 'RECEIVED',
                                diagnosis: null,
                                servicesAmount: 150,
                                stockItemsAmount: 400,
                                totalAmount: 550,
                                createdAt: new Date(),
                                startedAt: null,
                                finishedAt: null,
                                deliveredAt: null,
                                updatedAt: new Date(),
                            },
                        ]),
                    },
                },
                {
                    provide: ListOperationalServiceOrdersUseCase,
                    useValue: {
                        execute: jest.fn().mockResolvedValue([
                            {
                                id: 'service-order-1',
                                customerId: 'customer-1',
                                vehicleId: 'vehicle-1',
                                status: 'IN_PROGRESS',
                                diagnosis: null,
                                servicesAmount: 0,
                                stockItemsAmount: 0,
                                totalAmount: 0,
                                createdAt: new Date(),
                                startedAt: new Date(),
                                finishedAt: null,
                                deliveredAt: null,
                                updatedAt: new Date(),
                            },
                        ]),
                    },
                },
                { provide: OpenServiceOrderUseCase, useValue: { execute: jest.fn().mockResolvedValue({ id: 'service-order-1' }) } },
            ],
        })
        .overrideGuard(JwtAuthGuard)
        .useValue({ canActivate: () => true })
        .overrideGuard(RolesGuard)
        .useValue({ canActivate: () => true })
        .compile();

        app = moduleRef.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }));
        await app.init();
    });

    afterEach(async () => {
        await app?.close();
    });

    it('GET /service-orders should return service order history', async () => {
        await request(app.getHttpServer())
            .get('/service-orders')
            .expect(200)
            .expect(({ body }) => {
                expect(body).toHaveLength(1);
                expect(body[0].id).toBe('service-order-1');
                expect(body[0].totalAmount).toBe(550);
            });
    });

    it('GET /service-orders/:id should return service order details with items', async () => {
        await request(app.getHttpServer())
            .get('/service-orders/service-order-1')
            .expect(200)
            .expect(({ body }) => {
                expect(body.id).toBe('service-order-1');
                expect(body.services).toHaveLength(1);
                expect(body.stockItems).toHaveLength(1);
                expect(body.totalAmount).toBe(550);
            });
    });

    it('POST /service-orders should create a service order', async () => {
        await request(app.getHttpServer())
            .post('/service-orders')
            .send({ customerId: '18201d07-08aa-4e2f-ae0e-35a06e0e5e49', vehicleId: '70af8254-8ffa-42d6-8593-c0a80b2be3a5' })
            .expect(201)
            .expect(({ body }) => {
                expect(body.id).toBe('service-order-1');
            });
    });

    it('POST /service-orders should accept customer document', async () => {
        await request(app.getHttpServer())
            .post('/service-orders')
            .send({ customerDocument: '52998224725', vehicleId: '70af8254-8ffa-42d6-8593-c0a80b2be3a5' })
            .expect(201)
            .expect(({ body }) => {
                expect(body.id).toBe('service-order-1');
            });
    });

    it('POST /service-orders/opening should open a complete service order', async () => {
        await request(app.getHttpServer())
            .post('/service-orders/opening')
            .send({
                customer: {
                    name: 'John Doe',
                    documentType: 'CPF',
                    document: '52998224725',
                    email: 'john@example.com',
                },
                vehicle: {
                    licensePlate: 'ABC1D23',
                    brand: 'Toyota',
                    model: 'Corolla',
                    year: 2022,
                },
                services: [{ serviceId: 'service-1', quantity: 1 }],
                stockItems: [{ stockItemId: 'stock-1', quantity: 2 }],
            })
            .expect(201)
            .expect(({ body }) => {
                expect(body.id).toBe('service-order-1');
            });
    });

    it('GET /service-orders/operational-queue should return prioritized service orders', async () => {
        await request(app.getHttpServer())
            .get('/service-orders/operational-queue')
            .expect(200)
            .expect(({ body }) => {
                expect(body).toHaveLength(1);
                expect(body[0].status).toBe('IN_PROGRESS');
            });
    });

    it('GET /service-orders/:id/status should return service order status', async () => {
        await request(app.getHttpServer())
            .get('/service-orders/service-order-1/status')
            .expect(200)
            .expect(({ body }) => {
                expect(body.status).toBe('RECEIVED');
                expect(body.statusLabel).toBe('Recebida');
            });
    });

    it('GET /service-orders/metrics/average-execution-time should return execution metrics', async () => {
        await request(app.getHttpServer())
            .get('/service-orders/metrics/average-execution-time')
            .expect(200)
            .expect(({ body }) => {
                expect(body.averageExecutionTimeInMinutes).toBe(150);
                expect(body.averageExecutionTimeFormatted).toBe('2h 30m');
            });
    });

    it('PATCH /service-orders/:id/approve-budget should return 204', async () => {
        await request(app.getHttpServer())
            .patch('/service-orders/service-order-1/approve-budget')
            .expect(204);
    });

    it('POST /service-orders/:id/budget-decision should return 204', async () => {
        await request(app.getHttpServer())
            .post('/service-orders/service-order-1/budget-decision')
            .send({ decision: 'APPROVED' })
            .expect(204);
    });
});
