# ADR-0005: Split do monorepo em quatro repositórios

**Status:** Aceita
**Data:** 2026-08-03

## Contexto

O desafio exige explicitamente quatro repositórios separados, cada um com CI/CD próprio e branch `main` protegida:

1. Lambda (Function Serverless)
2. Infraestrutura Kubernetes (Terraform)
3. Infraestrutura do Banco de Dados Gerenciado (Terraform)
4. Aplicação principal executando em Kubernetes

Hoje (`oficina-tech-challenge`) é um monorepo único contendo aplicação, `infra/terraform` e `k8s/` juntos, com CI/CD unificado.

## Decisão

Split físico em quatro repositórios GitHub novos, cada um com seu próprio pipeline (GitHub Actions) e proteção de branch (`main` sem commit direto, PR obrigatório):

- `oficina-lambda-auth` — function serverless de autenticação por CPF (novo código).
- `oficina-infra-k8s` — Terraform dos recursos AWS que dão suporte ao cluster e ao gateway (API Gateway; o cluster em si fica local via Kind, ver ADR-0003 — o Terraform aqui cobre o que efetivamente é provisionado na AWS).
- `oficina-infra-database` — Terraform do RDS PostgreSQL (extraído/adaptado do `infra/terraform` atual).
- `oficina-api` — a aplicação NestJS principal; é o repositório atual (`oficina-tech-challenge`) migrado/renomeado, mantendo seu histórico.

## Consequências

### Positivas
- Atende ao requisito literal de quatro repositórios com CI/CD e proteção de branch independentes.
- Cada repositório passa a ter um README.md focado (propósito, tecnologias, deploy, diagrama específico, link do Swagger), como o desafio exige por repositório.
- `oficina-api` preserva o histórico de commits da Fase 2 em vez de recriar do zero — evidência de continuidade do trabalho para o avaliador.

### Negativas / trade-offs aceitos
- PRs que tocam mais de uma camada (ex: mudar contrato da API e a rota do gateway ao mesmo tempo) passam a exigir coordenação entre repositórios — aceito como custo inerente ao requisito do desafio, não uma escolha livre.
- Usuário `soat-architecture` precisa ser adicionado individualmente aos quatro repositórios antes da entrega — item de checklist final, não de arquitetura, mas registrado aqui para não ser esquecido.
