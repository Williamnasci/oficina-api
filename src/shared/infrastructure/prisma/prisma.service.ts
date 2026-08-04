import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    constructor() {
        const connectionString = process.env.DATABASE_URL;

        if (!connectionString) {
            throw new Error('DATABASE_URL is not defined.');
        }

        // @prisma/adapter-pg roda sobre node-postgres, que nao interpreta
        // "sslmode=require" da connection string (isso e uma convencao do
        // libpq, usada pelo engine nativo do Prisma, nao pelo driver pg). Sem
        // isso explicito, a conexao contra um RDS com rds.force_ssl=1 e
        // recusada. Condicional porque o Postgres local de dev/CI nao tem SSL
        // configurado. rejectUnauthorized: false porque o RDS usa a CA
        // propria da AWS, nao uma CA publica bundleada por padrao.
        const requiresSsl = /\bsslmode=require\b/.test(connectionString);
        const adapter = new PrismaPg({
            connectionString,
            ...(requiresSsl ? { ssl: { rejectUnauthorized: false } } : {}),
        });

        super({ adapter });
    }

    async onModuleInit(): Promise<void> {
        await this.$connect();
    }
}