import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { StockItemsController } from '../../../../src/modules/stock-items/interfaces/http/controllers/stock-items.controller';
import { CreateStockItemUseCase } from '../../../../src/modules/stock-items/application/use-cases/create-stock-item.use-case';
import { GetStockItemUseCase } from '../../../../src/modules/stock-items/application/use-cases/get-stock-item.use-case';
import { ListStockItemsUseCase } from '../../../../src/modules/stock-items/application/use-cases/list-stock-items.use-case';
import { UpdateStockItemUseCase } from '../../../../src/modules/stock-items/application/use-cases/update-stock-item.use-case';
import { DeleteStockItemUseCase } from '../../../../src/modules/stock-items/application/use-cases/delete-stock-item.use-case';
import { JwtAuthGuard } from '../../../../src/modules/auth/jwt-auth.guard';
import { RolesGuard } from '../../../../src/modules/auth/roles.guard';

describe('StockItemsController (integration)', () => {
    let app: INestApplication;

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            controllers: [StockItemsController],
            providers: [
                {
                    provide: CreateStockItemUseCase,
                    useValue: { execute: jest.fn().mockResolvedValue({ id: 'stock-item-1' }) },
                },
                {
                    provide: GetStockItemUseCase,
                    useValue: {
                        execute: jest.fn().mockResolvedValue({
                            id: 'stock-item-1',
                            name: 'Filtro de óleo',
                            description: 'Filtro do motor',
                            sku: 'FO-001',
                            quantity: 10,
                            unitPrice: 35.5,
                            isActive: true,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        })
                    },
                },
                {
                    provide: ListStockItemsUseCase,
                    useValue: { execute: jest.fn().mockResolvedValue([]) },
                },
                {
                    provide: UpdateStockItemUseCase,
                    useValue: { execute: jest.fn().mockResolvedValue(undefined) },
                },
                {
                    provide: DeleteStockItemUseCase,
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
        app.useGlobalPipes(new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }));
        await app.init();
    });

    afterEach(async () => {
        await app.close();
    });

    it('POST /stock-items should create stock item', async () => {
        await request(app.getHttpServer())
            .post('/stock-items')
            .send({
                name: 'Filtro de óleo',
                description: 'Filtro do motor',
                sku: 'FO-001',
                quantity: 10,
                unitPrice: 35.5,
                isActive: true,
            })
            .expect(201)
            .expect(({ body }) => {
                expect(body.id).toBe('stock-item-1');
            });
    });

    it('GET /stock-items/:id should return stock item', async () => {
        await request(app.getHttpServer())
            .get('/stock-items/stock-item-1')
            .expect(200)
            .expect(({ body }) => {
                expect(body.id).toBe('stock-item-1');
                expect(body.name).toBe('Filtro de óleo');
            });
    });
});