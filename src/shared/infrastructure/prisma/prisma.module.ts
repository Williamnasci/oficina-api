import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaUnitOfWork } from './prisma-unit-of-work';
import { UnitOfWork } from '../../domain/unit-of-work';

@Global()
@Module({
    providers: [
        PrismaService,
        {
            provide: UnitOfWork,
            useClass: PrismaUnitOfWork,
        },
    ],
    exports: [PrismaService, UnitOfWork],
})
export class PrismaModule {}
