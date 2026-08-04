# RFC-0002: Escolha do banco de dados gerenciado

**Status:** Aceita
**Data:** 2026-08-03

## Resumo

Adotar **Amazon RDS para PostgreSQL**, instância `db.t3.micro` (Free Tier), single-AZ, como banco de dados gerenciado, migrando o schema Prisma já existente sem trocar de motor.

## Contexto

A Fase 2 já usa PostgreSQL via Prisma (schema relacional, migrations versionadas, `CustomerDocument`/`LicensePlate` como value objects mapeados em colunas). O desafio pede um "Banco de Dados Gerenciado (PostgreSQL, MySQL, SQL Server, etc.)" com justificativa formal e diagrama ER.

## Alternativas consideradas

### A — Trocar para MySQL ou SQL Server gerenciado
Prós: nenhum específico para este projeto — seriam apenas outras opções "gerenciadas" válidas perante o enunciado.
Contras: reescrever schema Prisma, migrations e queries específicas (o domínio já usa tipos/constraints do Postgres implicitamente via Prisma) sem nenhum ganho técnico real; risco de regressão em toda a camada de persistência às vésperas do prazo.
Descartada — troca de motor sem motivação técnica.

### B — Aurora PostgreSQL Serverless v2
Prós: escala automaticamente, mais "cloud-native".
Contras: não é Free Tier (cobrança por ACU mesmo em repouso mínimo); complexidade de configuração (Data API, VPC, capacity units) desproporcional ao volume de dados de um desafio acadêmico.
Descartada por custo, dado o RFC-0001 (conta pessoal Free Tier).

### C — RDS PostgreSQL `db.t3.micro`, single-AZ
Prós: mesmo motor do Prisma atual (migração = apontar `DATABASE_URL` + rodar migrations existentes, sem reescrever schema), Free Tier (750h/mês grátis nos primeiros 12 meses, 20GB de storage), suficiente para o volume de um projeto acadêmico.
Contras: single-AZ não tem failover automático — aceitável, pois alta disponibilidade de banco não é um requisito explícito do desafio (o requisito de disponibilidade recai sobre o cluster Kubernetes/HPA da aplicação, não sobre o banco).

## Decisão

RDS PostgreSQL, `db.t3.micro`, single-AZ, mesma modelagem Prisma da Fase 2 (com os ajustes de consistência/performance previstos no desafio, documentados separadamente no diagrama ER — ver `docs/database-er.md`, a criar).

## Consequências

- Migração de dados é apenas operacional (rodar `prisma migrate deploy` contra o endpoint RDS), sem trabalho de reescrita de schema.
- Backups automáticos do RDS (retenção padrão) cobrem o requisito implícito de continuidade, sem custo adicional dentro do Free Tier.
- Falta de multi-AZ é uma limitação assumida conscientemente — se cobrado, a justificativa é a restrição de custo do RFC-0001, não desconhecimento da prática recomendada.
