import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../../../src/app.module';
import { PrismaService } from '../../../../src/shared/infrastructure/prisma/prisma.service';
import { CustomerDocumentType } from '../../../../src/modules/customers/domain/enums/customer-document-type.enum';

// Prova, contra o banco real (nao mocks), que abrir uma OS e atomico entre
// os repositorios de Customer, Vehicle e ServiceOrder (ALT-03). Antes do
// UnitOfWork, cada repositorio escrevia em sua propria transacao Prisma - se
// a etapa de estoque falhasse por ultimo, cliente e veiculo (recem-criados
// nesta mesma chamada) ficavam orfaos no banco, sem OS nenhuma referenciando
// eles.
describe('OpenServiceOrderUseCase atomicity (real integration)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let accessToken: string;

    const ids = {
        service: 'aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa',
        stockItem: 'bbbbbbbb-2222-4bbb-8bbb-bbbbbbbbbbbb',
    };

    const newCustomerDocument = '11144477735';
    const newVehiclePlate = 'ROL1B23';

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

    it('should roll back the new customer and vehicle when a later step of the flow fails', async () => {
        const stockBefore = await prisma.stockItem.findUniqueOrThrow({
            where: { id: ids.stockItem },
        });

        await request(app.getHttpServer())
            .post('/service-orders/opening')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                customer: {
                    name: 'Rollback Test Customer',
                    documentType: CustomerDocumentType.CPF,
                    document: newCustomerDocument,
                },
                vehicle: {
                    licensePlate: newVehiclePlate,
                    brand: 'Fiat',
                    model: 'Uno',
                    year: 2015,
                },
                services: [{ serviceId: ids.service, quantity: 1 }],
                // pede mais do que existe em estoque - a ultima escrita do
                // fluxo (addStockItemToOrder) falha de proposito.
                stockItems: [
                    { stockItemId: ids.stockItem, quantity: stockBefore.quantity + 1 },
                ],
            })
            .expect(409);

        const customerAfter = await prisma.customer.findUnique({
            where: { document: newCustomerDocument },
        });
        const vehicleAfter = await prisma.vehicle.findUnique({
            where: { licensePlate: newVehiclePlate },
        });
        const stockAfter = await prisma.stockItem.findUniqueOrThrow({
            where: { id: ids.stockItem },
        });

        // Antes do UnitOfWork, este customer e este vehicle ficariam
        // persistidos (a falha era so no ultimo passo), mesmo sem nenhuma OS
        // valida referenciando eles.
        expect(customerAfter).toBeNull();
        expect(vehicleAfter).toBeNull();
        expect(stockAfter.quantity).toBe(stockBefore.quantity);

        const orphanOrders = await prisma.serviceOrder.findMany({
            where: { vehicle: { licensePlate: newVehiclePlate } },
        });
        expect(orphanOrders).toHaveLength(0);
    });

    async function seedBaseData(): Promise<void> {
        await prisma.serviceCatalog.create({
            data: {
                id: ids.service,
                name: 'Alinhamento',
                description: 'Alinhamento e balanceamento.',
                price: 120,
            },
        });

        await prisma.stockItem.create({
            data: {
                id: ids.stockItem,
                name: 'Pastilha de freio (rollback test)',
                description: 'Usado apenas no teste de rollback.',
                sku: 'TST-ROLLBACK-PAD',
                quantity: 2,
                unitPrice: 80,
            },
        });
    }

    async function cleanup(): Promise<void> {
        await prisma.serviceOrder.deleteMany({
            where: { vehicle: { licensePlate: newVehiclePlate } },
        });
        await prisma.vehicle.deleteMany({
            where: { licensePlate: newVehiclePlate },
        });
        await prisma.customer.deleteMany({
            where: { document: newCustomerDocument },
        });
        await prisma.stockItem.deleteMany({ where: { id: ids.stockItem } });
        await prisma.stockItem.deleteMany({ where: { sku: 'TST-ROLLBACK-PAD' } });
        await prisma.serviceCatalog.deleteMany({ where: { id: ids.service } });
    }
});
