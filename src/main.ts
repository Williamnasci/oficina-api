// dd-trace precisa ser inicializado antes de qualquer outro import para
// conseguir instrumentar automaticamente (auto-patch) os modulos carregados
// depois dele (express, pg, etc). So ativa quando DD_AGENT_HOST esta
// definido, para nao tentar conectar num agent inexistente em dev/testes.
if (process.env.DD_AGENT_HOST) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('dd-trace').init({
    logInjection: true,
  });
}

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import * as express from 'express';
import { join } from 'path';
import { AppModule } from './app.module';
import { DomainExceptionFilter } from './shared/infrastructure/filters/domain-exception.filter';
import { PrismaExceptionFilter } from './shared/infrastructure/filters/prisma-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );

  app.use(express.static(join(process.cwd(), 'public')));

  const corsOrigin = process.env.CORS_ORIGIN || '*';

  app.enableCors({
    origin: corsOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: corsOrigin !== '*',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(
    new DomainExceptionFilter(),
    new PrismaExceptionFilter(),
  );

  const config = new DocumentBuilder()
    .setTitle('Oficina API')
    .setDescription('API do Tech Challenge - Sistema de Oficina Mecânica')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
