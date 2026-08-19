import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { TransactionContext, UnitOfWork } from '../../domain/unit-of-work';

@Injectable()
export class PrismaUnitOfWork implements UnitOfWork {
  constructor(private readonly prisma: PrismaService) {}

  async runInTransaction<T>(
    work: (tx: TransactionContext) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction((tx) => work(tx));
  }
}
