import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../../../src/app.module';
import { PrismaService } from '../../../../src/shared/infrastructure/prisma/prisma.service';
import { DomainExceptionFilter } from '../../../../src/shared/infrastructure/filters/domain-exception.filter';
import { PrismaExceptionFilter } from '../../../../src/shared/infrastructure/filters/prisma-exception.filter';

// Regressao dos achados ALT-01/ALT-02/MED-02 da revisao externa: itens
// adicionados fora do estado permitido, corrida no calculo dos agregados
// financeiros, e transicoes concorrentes com last-write-wins. Testes contra
// o banco real (nao mocks) - a corrida so se manifesta com Postgres de
// verdade.
describe('ServiceOrders budget integrity under concurrency (real integration)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let accessToken: string;

    const ids = {
        customer: '55555555-1111-4555-8555-555555555555',
        vehicle: '66666666-2222-4666-8666-666666666666',
        serviceA: '77777777-3333-4777-8777-777777777777',
        serviceB: '88888888-4444-4888-8888-888888888888',
        stockItemA: '99999999-5555-4999-8999-999999999999',
        stockItemB: 'aaaaaaaa-6666-4aaa-8aaa-aaaaaaaaaaaa',
    };

    const createdOrderIds: string[] = [];

    beforeAll(async () => {
        process.env.DATABASE_URL =
            process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

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
        // Testes de integracao criam a app via createNestApplication(), que
        // NAO passa por main.ts/bootstrap() - sem isso, DomainException (ex.:
        // ALT-01) responde 500 generico em vez de 422, porque nenhum filtro
        // global esta registrado. Gap pre-existente em toda a suite de
        // integracao (nenhum outro arquivo registra isso), so nunca
        // apareceu porque nenhum teste anterior exercitava esse caminho via
        // HTTP de verdade.
        app.useGlobalFilters(
            new DomainExceptionFilter(),
            new PrismaExceptionFilter(),
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

    async function openOrder(): Promise<string> {
        const response = await request(app.getHttpServer())
            .post('/service-orders')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ customerId: ids.customer, vehicleId: ids.vehicle })
            .expect(201);

        const orderId = response.body.id as string;
        createdOrderIds.push(orderId);

        return orderId;
    }

    async function advanceToApproved(orderId: string): Promise<void> {
        await request(app.getHttpServer())
            .patch(`/service-orders/${orderId}/diagnosis`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ diagnosis: 'Regression test diagnosis.' })
            .expect(204);

        await request(app.getHttpServer())
            .patch(`/service-orders/${orderId}/send-budget`)
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(204);

        await request(app.getHttpServer())
            .patch(`/service-orders/${orderId}/approve-budget`)
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(204);
    }

    it('should reject adding a service to an order that is already approved (ALT-01)', async () => {
        const orderId = await openOrder();
        await advanceToApproved(orderId);

        await request(app.getHttpServer())
            .post(`/service-orders/${orderId}/services`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ serviceId: ids.serviceA, quantity: 1 })
            .expect(422);

        const order = await prisma.serviceOrder.findUniqueOrThrow({
            where: { id: orderId },
        });
        expect(Number(order.servicesAmount)).toBe(0);
    });

    it('should reject adding a stock item to a delivered order (ALT-01)', async () => {
        const orderId = await openOrder();
        await advanceToApproved(orderId);

        await request(app.getHttpServer())
            .patch(`/service-orders/${orderId}/start-execution`)
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(204);
        await request(app.getHttpServer())
            .patch(`/service-orders/${orderId}/finish`)
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(204);
        await request(app.getHttpServer())
            .patch(`/service-orders/${orderId}/deliver`)
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(204);

        const stockBefore = await prisma.stockItem.findUniqueOrThrow({
            where: { id: ids.stockItemA },
        });

        await request(app.getHttpServer())
            .post(`/service-orders/${orderId}/stock-items`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ stockItemId: ids.stockItemA, quantity: 1 })
            .expect(422);

        // Prova que o estoque NAO foi baixado - antes da correcao, o
        // endpoint aceitava a inclusao e decrementava o estoque mesmo com
        // a OS ja entregue.
        const stockAfter = await prisma.stockItem.findUniqueOrThrow({
            where: { id: ids.stockItemA },
        });
        expect(stockAfter.quantity).toBe(stockBefore.quantity);
    });

    it('should keep servicesAmount/totalAmount correct when two different services are added concurrently (ALT-02)', async () => {
        const orderId = await openOrder();

        const [resultA, resultB] = await Promise.all([
            request(app.getHttpServer())
                .post(`/service-orders/${orderId}/services`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ serviceId: ids.serviceA, quantity: 1 }),
            request(app.getHttpServer())
                .post(`/service-orders/${orderId}/services`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ serviceId: ids.serviceB, quantity: 1 }),
        ]);

        expect(resultA.status).toBe(204);
        expect(resultB.status).toBe(204);

        const order = await prisma.serviceOrder.findUniqueOrThrow({
            where: { id: orderId },
            include: { services: true },
        });

        // serviceA = 150, serviceB = 90 (ver seedBaseData) - antes da
        // correcao, o padrao "ler todos os itens, somar em memoria,
        // escrever valor absoluto" deixava servicesAmount refletir so uma
        // das duas inclusoes concorrentes (lost update), mesmo com as
        // duas linhas de item persistidas corretamente.
        expect(order.services).toHaveLength(2);
        expect(Number(order.servicesAmount)).toBe(240);
        expect(Number(order.totalAmount)).toBe(240);
    });

    it('should keep stockItemsAmount/totalAmount correct when two different stock items are added concurrently (ALT-02)', async () => {
        const orderId = await openOrder();

        const [resultA, resultB] = await Promise.all([
            request(app.getHttpServer())
                .post(`/service-orders/${orderId}/stock-items`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ stockItemId: ids.stockItemA, quantity: 1 }),
            request(app.getHttpServer())
                .post(`/service-orders/${orderId}/stock-items`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ stockItemId: ids.stockItemB, quantity: 1 }),
        ]);

        expect(resultA.status).toBe(204);
        expect(resultB.status).toBe(204);

        const order = await prisma.serviceOrder.findUniqueOrThrow({
            where: { id: orderId },
            include: { stockItems: true },
        });

        // stockItemA = 50, stockItemB = 30 (ver seedBaseData)
        expect(order.stockItems).toHaveLength(2);
        expect(Number(order.stockItemsAmount)).toBe(80);
        expect(Number(order.totalAmount)).toBe(80);
    });

    it('should apply only one of two concurrent conflicting budget decisions (MED-02)', async () => {
        const orderId = await openOrder();

        await request(app.getHttpServer())
            .patch(`/service-orders/${orderId}/diagnosis`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ diagnosis: 'Regression test diagnosis.' })
            .expect(204);
        await request(app.getHttpServer())
            .patch(`/service-orders/${orderId}/send-budget`)
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(204);

        const [approveResult, rejectResult] = await Promise.all([
            request(app.getHttpServer())
                .patch(`/service-orders/${orderId}/approve-budget`)
                .set('Authorization', `Bearer ${accessToken}`),
            request(app.getHttpServer())
                .post(`/service-orders/${orderId}/budget-decision`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ decision: 'REJECTED' }),
        ]);

        const statuses = [approveResult.status, rejectResult.status].sort();

        // Uma das duas decisoes deve ter sido aplicada com sucesso (204) e
        // a outra rejeitada por conflito (409) - antes da correcao, as
        // duas podiam suceder (204/204), com a ultima escrita
        // sobrescrevendo silenciosamente a decisao da primeira.
        expect(statuses).toEqual([204, 409]);

        const order = await prisma.serviceOrder.findUniqueOrThrow({
            where: { id: orderId },
        });
        expect(['APPROVED', 'IN_DIAGNOSIS']).toContain(order.status);
    });

    async function seedBaseData(): Promise<void> {
        await prisma.customer.create({
            data: {
                id: ids.customer,
                name: 'Budget Integrity Test Customer',
                documentType: 'CPF',
                document: '11122233396',
                phone: '11988887777',
                email: 'budget.integrity@example.com',
            },
        });

        await prisma.vehicle.create({
            data: {
                id: ids.vehicle,
                customerId: ids.customer,
                licensePlate: 'BGI9T88',
                brand: 'Chevrolet',
                model: 'Onix',
                year: 2023,
            },
        });

        await prisma.serviceCatalog.create({
            data: {
                id: ids.serviceA,
                name: 'Alinhamento (regression A)',
                description: 'Usado apenas no teste de integridade de orcamento.',
                price: 150,
            },
        });

        await prisma.serviceCatalog.create({
            data: {
                id: ids.serviceB,
                name: 'Balanceamento (regression B)',
                description: 'Usado apenas no teste de integridade de orcamento.',
                price: 90,
            },
        });

        await prisma.stockItem.create({
            data: {
                id: ids.stockItemA,
                name: 'Filtro de oleo (regression A)',
                description: 'Usado apenas no teste de integridade de orcamento.',
                sku: 'TST-BGI-A',
                quantity: 10,
                unitPrice: 50,
            },
        });

        await prisma.stockItem.create({
            data: {
                id: ids.stockItemB,
                name: 'Filtro de ar (regression B)',
                description: 'Usado apenas no teste de integridade de orcamento.',
                sku: 'TST-BGI-B',
                quantity: 10,
                unitPrice: 30,
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
        await prisma.stockItem.deleteMany({
            where: { id: { in: [ids.stockItemA, ids.stockItemB] } },
        });
        await prisma.stockItem.deleteMany({
            where: { sku: { in: ['TST-BGI-A', 'TST-BGI-B'] } },
        });
        await prisma.serviceCatalog.deleteMany({
            where: { id: { in: [ids.serviceA, ids.serviceB] } },
        });
        await prisma.vehicle.deleteMany({ where: { id: ids.vehicle } });
        await prisma.vehicle.deleteMany({ where: { licensePlate: 'BGI9T88' } });
        await prisma.customer.deleteMany({ where: { id: ids.customer } });
        await prisma.customer.deleteMany({ where: { document: '11122233396' } });
    }
});
