import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './shared/infrastructure/prisma/prisma.service';
import { MetricsService } from './observability/metrics.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
          },
        },
        {
          provide: MetricsService,
          useValue: {
            setHealthcheckStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return API status message', () => {
      expect(appController.getHello()).toBe('Oficina API is running.');
    });
  });

  describe('health', () => {
    it('should return health status', async () => {
      await expect(appController.getHealth()).resolves.toEqual({
        status: 'ok',
        app: 'ok',
        database: 'ok',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.any() is typed `any` by @types/jest, not a real unsafe value
        timestamp: expect.any(String),
      });
    });
  });
});
