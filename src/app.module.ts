import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import { CustomersModule } from './modules/customers/customers.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { ServiceOrdersModule } from './modules/service-orders/service-orders.module';
import { PrismaModule } from './shared/infrastructure/prisma/prisma.module';
import { StockItemsModule } from './modules/stock-items/stock-items.module';
import { ServiceCatalogModule } from './modules/service-catalog/service-catalog.module';
import { AuthModule } from './modules/auth/auth.module';
import { ObservabilityModule } from './observability/observability.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Logs JSON estruturados com correlation ID por requisicao (req.id) e,
    // quando dd-trace esta ativo (ver main.ts), com dd.trace_id/dd.span_id
    // injetados automaticamente - correlaciona log <-> trace no Datadog.
    LoggerModule.forRoot({
      pinoHttp: {
        genReqId: (req) => req.headers['x-request-id'] ?? randomUUID(),
        customProps: () => ({ service: 'oficina-api' }),
        redact: ['req.headers.authorization'],
      },
    }),
    AuthModule,
    PrismaModule,
    CustomersModule,
    VehiclesModule,
    ServiceOrdersModule,
    StockItemsModule,
    ServiceCatalogModule,
    ObservabilityModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
