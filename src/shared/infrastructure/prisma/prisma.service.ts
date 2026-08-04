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

        // node-postgres (usado pelo @prisma/adapter-pg) trata "sslmode=require"
        // na connection string como alias de "verify-full", validando o
        // certificado do servidor contra as CAs conhecidas do Node - o que
        // falha contra o RDS, que usa a CA propria da AWS, nao uma CA publica.
        // Solucao: tirar sslmode da URL e configurar SSL explicitamente via
        // objeto (rejectUnauthorized: false = criptografado, sem validar CA).
        // Condicional porque o Postgres local de dev/CI nao usa SSL.
        const requiresSsl = /\bsslmode=require\b/.test(connectionString);
        const cleanConnectionString = connectionString.replace(/[?&]sslmode=require\b/, '');
        const adapter = new PrismaPg({
            connectionString: cleanConnectionString,
            ...(requiresSsl ? { ssl: { rejectUnauthorized: false } } : {}),
        });

        super({ adapter });
    }

    async onModuleInit(): Promise<void> {
        await this.$connect();
    }
}