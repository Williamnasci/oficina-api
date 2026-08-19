// Handle opaco para uma transacao em andamento. O dominio nao sabe (nem deve
// saber) que por baixo isso e um Prisma.TransactionClient - cada adapter de
// infraestrutura e responsavel por fazer o cast de volta pro tipo concreto
// que ele mesmo produziu via UnitOfWork.runInTransaction.
export type TransactionContext = unknown;

// Permite que um use case componha operacoes de escrita de varios
// repositorios (potencialmente de modulos diferentes) numa unica transacao
// atomica, sem o dominio depender de Prisma ou de qualquer client de banco
// especifico. Repositorios que participam de uma transacao aceitam um
// TransactionContext opcional em seus metodos de escrita; quando omitido,
// cada chamada e atomica isoladamente (comportamento anterior, preservado).
export abstract class UnitOfWork {
    abstract runInTransaction<T>(
        work: (tx: TransactionContext) => Promise<T>,
    ): Promise<T>;
}
