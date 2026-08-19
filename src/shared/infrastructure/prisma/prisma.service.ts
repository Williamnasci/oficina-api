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

    // node-postgres (usado pelo @prisma/adapter-pg) trata "sslmode=require"
    // na connection string como alias de "verify-full", validando o
    // certificado do servidor contra as CAs padrao do Node - o que falha
    // contra o RDS, que usa a CA propria da AWS, nao uma CA publica
    // conhecida por padrao. Solucao correta: tirar sslmode da URL e
    // fornecer o bundle oficial de CA da AWS via `ca`, mantendo
    // rejectUnauthorized: true (valida de verdade a identidade do
    // servidor, nao so criptografa). Condicional porque o Postgres local
    // de dev/CI nao usa SSL.
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
