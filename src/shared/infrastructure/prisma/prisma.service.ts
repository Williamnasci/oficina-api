import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { RDS_CA_BUNDLE } from './rds-ca-bundle';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL is not defined.');
    }

    const requiresSsl = /\bsslmode=require\b/.test(connectionString);
    const cleanConnectionString = connectionString.replace(
      /[?&]sslmode=require\b/,
      '',
    );
    const adapter = new PrismaPg({
      connectionString: cleanConnectionString,
      ...(requiresSsl
        ? { ssl: { ca: RDS_CA_BUNDLE, rejectUnauthorized: true } }
        : {}),
    });

    super({ adapter });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }
}
