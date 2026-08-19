import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../../../src/app.module';
import { PrismaService } from '../../../../src/shared/infrastructure/prisma/prisma.service';
import { ServiceOrderStatus } from '../../../../src/modules/service-orders/domain/enums/service-order-status.enum';

describe('ServiceOrders transactional budget and stock flow (real integration)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let accessToken: string;

    const ids = {
        customer: '11111111-1111-4111-8111-111111111111',
        vehicle: '22222222-2222-4222-8222-222222222222',
        service: '33333333-3333-4333-8333-333333333333',
        stockItem: '44444444-4444-4444-8444-444444444444',
    };

    const createdOrderIds: string[] = [];

    beforeAll(async () => {
        process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        );

        await app.init();

        prisma = app.get(PrismaService);
        await cleanup();
        await seedBaseData();

        const loginResponse = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ username: 'admin', password: 'admin' })
            .expect(201);

        accessToken = loginResponse.body.access_token;
    });

    afterAll(async () => {
        await cleanup();
        await app.close();
        await prisma.$disconnect();
    });

    it('should persist automatic budget, approve the order and decrease stock in the real database', async () => {
        const createOrderResponse = await request(app.getHttpServer())
            .post('/service-orders')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                customerId: ids.customer,
                vehicleId: ids.vehicle,
            })
            .expect(201);

        const orderId = createOrderResponse.body.id;
        createdOrderIds.push(orderId);

        await request(app.getHttpServer())
            .patch(`/service-orders/${orderId}/diagnosis`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ diagnosis: 'Brake pads replacement required.' })
            .expect(204);

        await request(app.getHttpServer())
            .post(`/service-orders/${orderId}/services`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ serviceId: ids.service, quantity: 1 })
            .expect(204);

        await request(app.getHttpServer())
            .post(`/service-orders/${orderId}/stock-items`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ stockItemId: ids.stockItem, quantity: 2 })
            .expect(204);

        await request(app.getHttpServer())
            .patch(`/service-orders/${orderId}/send-budget`)
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(204);

        await request(app.getHttpServer())
            .patch(`/service-orders/${orderId}/approve-budget`)
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(204);

        const approvedOrder = await prisma.serviceOrder.findUniqueOrThrow({
            where: { id: orderId },
        });
        expect(approvedOrder.status).toBe(ServiceOrderStatus.APPROVED);
        expect(approvedOrder.startedAt).toBeNull();

        await request(app.getHttpServer())
            .patch(`/service-orders/${orderId}/start-execution`)
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(204);

        const persistedOrder = await prisma.serviceOrder.findUniqueOrThrow({
            where: { id: orderId },
            include: {
                services: true,
                stockItems: true,
            },
        });
        const persistedStockItem = await prisma.stockItem.findUniqueOrThrow({
            where: { id: ids.stockItem },
        });

        expect(persistedOrder.status).toBe(ServiceOrderStatus.IN_PROGRESS);
        expect(persistedOrder.startedAt).toBeInstanceOf(Date);
        expect(Number(persistedOrder.servicesAmount)).toBe(150);
        expect(Number(persistedOrder.stockItemsAmount)).toBe(400);
        expect(Number(persistedOrder.totalAmount)).toBe(550);
        expect(persistedOrder.services).toHaveLength(1);
        expect(persistedOrder.services[0]).toMatchObject({
            serviceId: ids.service,
            quantity: 1,
        });
        expect(Number(persistedOrder.services[0].totalPrice)).toBe(150);
        expect(persistedOrder.stockItems).toHaveLength(1);
        expect(persistedOrder.stockItems[0]).toMatchObject({
            stockItemId: ids.stockItem,
            quantity: 2,
        });
        expect(Number(persistedOrder.stockItems[0].totalPrice)).toBe(400);
        expect(persistedStockItem.quantity).toBe(3);
    });

    it('should rollback stock item insertion, stock decrease and budget recalculation when stock is insufficient', async () => {
        const createOrderResponse = await request(app.getHttpServer())
            .post('/service-orders')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                customerId: ids.customer,
                vehicleId: ids.vehicle,
            })
            .expect(201);

        const orderId = createOrderResponse.body.id;
        createdOrderIds.push(orderId);

        const stockBefore = await prisma.stockItem.findUniqueOrThrow({
            where: { id: ids.stockItem },
        });

        await request(app.getHttpServer())
            .post(`/service-orders/${orderId}/stock-items`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ stockItemId: ids.stockItem, quantity: stockBefore.quantity + 1 })
            .expect(409);

        const persistedOrder = await prisma.serviceOrder.findUniqueOrThrow({
            where: { id: orderId },
            include: { stockItems: true },
        });
        const stockAfter = await prisma.stockItem.findUniqueOrThrow({
            where: { id: ids.stockItem },
        });

        expect(stockAfter.quantity).toBe(stockBefore.quantity);
        expect(persistedOrder.stockItems).toHaveLength(0);
        expect(Number(persistedOrder.stockItemsAmount)).toBe(0);
        expect(Number(persistedOrder.totalAmount)).toBe(0);
    });

    it('should not oversell stock when two requests race for the same item concurrently', async () => {
        const stockBefore = await prisma.stockItem.findUniqueOrThrow({
            where: { id: ids.stockItem },
        });

        // Duas OS pedindo mais da metade do estoque cada uma - juntas
        // excedem o disponivel, mas nenhuma sozinha excede. Um read-check-
        // write nao atomico deixaria as duas passarem (overselling); o
        // decremento condicional (WHERE quantity >= X) so deixa uma.
        const requestedEach = Math.ceil(stockBefore.quantity / 2) + 1;

        const [orderAId, orderBId] = await Promise.all(
            [0, 1].map(async () => {
                const response = await request(app.getHttpServer())
                    .post('/service-orders')
                    .set('Authorization', `Bearer ${accessToken}`)
                    .send({ customerId: ids.customer, vehicleId: ids.vehicle })
                    .expect(201);

                return response.body.id as string;
            }),
        );
        createdOrderIds.push(orderAId, orderBId);

        const results = await Promise.all(
            [orderAId, orderBId].map((orderId) =>
                request(app.getHttpServer())
                    .post(`/service-orders/${orderId}/stock-items`)
                    .set('Authorization', `Bearer ${accessToken}`)
                    .send({ stockItemId: ids.stockItem, quantity: requestedEach }),
            ),
        );

        const succeeded = results.filter((r) => r.status === 204);
        const rejected = results.filter((r) => r.status === 409);

        expect(succeeded).toHaveLength(1);
        expect(rejected).toHaveLength(1);

        const stockAfter = await prisma.stockItem.findUniqueOrThrow({
            where: { id: ids.stockItem },
        });

        expect(stockAfter.quantity).toBe(stockBefore.quantity - requestedEach);
        expect(stockAfter.quantity).toBeGreaterThanOrEqual(0);
    });

    async function seedBaseData(): Promise<void> {
        await prisma.customer.create({
            data: {
                id: ids.customer,
                name: 'Integration Test Customer',
                documentType: 'CPF',
                document: '98765432109',
                phone: '11999999999',
                email: 'integration.customer@example.com',
            },
        });

        await prisma.vehicle.create({
            data: {
                id: ids.vehicle,
                customerId: ids.customer,
                licensePlate: 'TST1A23',
                brand: 'Toyota',
                model: 'Corolla',
                year: 2022,
            },
        });

        await prisma.serviceCatalog.create({
            data: {
                id: ids.service,
                name: 'Brake inspection',
                description: 'Brake system inspection and labor.',
                price: 150,
            },
        });

        await prisma.stockItem.create({
            data: {
                id: ids.stockItem,
                name: 'Brake pad',
                description: 'Front brake pad set.',
                sku: 'TST-BRAKE-PAD',
                quantity: 5,
                unitPrice: 200,
            },
        });
    }

    async function cleanup(): Promise<void> {
        await prisma.serviceOrder.deleteMany({
            where: {
                OR: [
                    { id: { in: createdOrderIds } },
                    { customerId: ids.customer },
                ],
            },
        });
        await prisma.stockItem.deleteMany({ where: { id: ids.stockItem } });
        await prisma.stockItem.deleteMany({ where: { sku: 'TST-BRAKE-PAD' } });
        await prisma.serviceCatalog.deleteMany({ where: { id: ids.service } });
        await prisma.vehicle.deleteMany({ where: { id: ids.vehicle } });
        await prisma.vehicle.deleteMany({ where: { licensePlate: 'TST1A23' } });
        await prisma.customer.deleteMany({ where: { id: ids.customer } });
        await prisma.customer.deleteMany({ where: { document: '98765432109' } });
    }
});
