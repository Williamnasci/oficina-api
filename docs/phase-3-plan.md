# Plano da Fase 3

## Objetivo

Evoluir a aplicação da oficina mecânica (concluída na Fase 2) para um nível de operação corporativa, incorporando API Gateway, autenticação serverless via CPF, banco de dados gerenciado, observabilidade com Datadog e documentação arquitetural formal (diagramas, RFCs, ADRs), conforme o enunciado `13SOAT - Fase 3 - Tech Challenge.pdf`.

Este documento registra as decisões tomadas antes da implementação e o roteiro de trabalho. Ele antecede a implementação, ao contrário de `phase-2-plan.md`, que documenta um trabalho já concluído.

## Ponto de partida (estado real do repositório hoje)

- Aplicação NestJS + Prisma + PostgreSQL, Clean Architecture em camadas, rodando em Docker/Docker Compose, Kubernetes (cluster Kind local) e Terraform, com CI/CD em GitHub Actions — tudo entregue na Fase 2.
- Autenticação atual (`src/modules/auth`) é um login fixo `admin`/`admin` que gera um JWT genérico (`role: admin`). **Não há autenticação por CPF nem function serverless** — isso é 100% novo na Fase 3.
- O módulo `customers` já valida CPF/CNPJ (`CustomerDocument` value object) e tem um caso de uso `find-customer-by-document`, que é a peça de domínio que a function serverless de autenticação vai precisar consultar.
- Observabilidade atual é Prometheus + Grafana locais (Fase 2). Datadog é 100% novo.
- Não existe API Gateway, nem split em múltiplos repositórios — hoje é um monorepo único.

## Decisões tomadas (formato ADR resumido)

### ADR-1: Nuvem — AWS Free Tier (conta pessoal)

Revalidado com base no material real da Fase 3 (ver análise abaixo): o padrão CPF → valida → consulta cliente → emite JWT só é ensinado com Lambda + API Gateway na AWS (módulo "Desenvolvimento Serverless"), sem alternativa equivalente em Azure/GCP no curso. Isso torna a AWS praticamente obrigatória para a peça de autenticação, independente de qual conta se use.

Conta usada: pessoal, Free Tier (`us-east-2` / Ohio, já confirmada em uso). Diferente do plano original (AWS Academy Learner Lab), não há restrição de IAM nem expiração de credenciais por sessão — mas também não há crédito institucional cobrindo custo além do Free Tier, então **custo real é uma restrição de projeto a partir de agora** (ver ADR-3 no diretório `docs/adr/` sobre a decisão de cluster Kubernetes local por causa disso).

### ADR-2: Observabilidade — Datadog

Escolhido em vez de New Relic por já constar como meta de aprendizado no plano de estudos atual (Fase 3, Datadog/Newrelic). Confirmado pela análise do material: o módulo "Monitoramento e Acesso Avançado" (12 aulas) é 100% dedicado a Datadog e New Relic, ambos cloud-agnósticos — a escolha não amarra a infraestrutura a nenhum provedor.

### ADR-3: API Gateway — AWS API Gateway (HTTP API v2), roteamento híbrido

Confirmado como AWS API Gateway (HTTP API v2, `aws_apigatewayv2_*`), integrado com a Lambda de auth e com a aplicação principal via proxy. Decisão detalhada, incluindo a estratégia de rotas (proxy para a aplicação + rotas explícitas só onde o integration/authorizer muda), está em `docs/adr/0004-api-gateway-roteamento.md`.

Nota: o módulo de aula "API Gateway" do curso ensina Azure APIM e Kong, não AWS API Gateway — essa parte específica não é "aula-alinhada". A escolha por AWS API Gateway prioriza consistência com o restante da infra (mesma nuvem da Lambda de auth, sem operar um segundo gateway) e é o padrão efetivamente demonstrado no módulo de Serverless (Aulas 5-6) para proteger rotas com JWT.

### ADR-4: Estrutura de repositórios — split físico a partir do monorepo atual

Quatro repositórios novos no GitHub, cada um com CI/CD e branch `main` protegida:

1. `oficina-lambda-auth` — function serverless de autenticação por CPF.
2. `oficina-infra-k8s` — Terraform do cluster Kubernetes.
3. `oficina-infra-database` — Terraform do banco de dados gerenciado (RDS Postgres).
4. `oficina-api` — a aplicação NestJS principal (o atual `oficina-tech-challenge`, renomeado/migrado).

O repositório atual (`oficina-tech-challenge`) vira a base do `oficina-api`; os módulos de infraestrutura (`infra/terraform`, `k8s/`) são extraídos para os dois repositórios de infraestrutura.

## Requisitos obrigatórios mapeados

| Requisito do PDF | Onde entra | Está pronto? |
|---|---|---|
| API Gateway | Terraform em `oficina-infra-k8s` (ou repo próprio de gateway) — AWS API Gateway HTTP API v2 | Não |
| Function serverless de auth por CPF (valida CPF, consulta cliente, gera JWT) | `oficina-lambda-auth`, reaproveitando a lógica de `find-customer-by-document`; JWT gerado via lib própria (`jsonwebtoken`), não via Cognito — ver `docs/adr/0005-lambda-auth-custom-vs-cognito.md` | Não |
| Proteção de rotas sensíveis via CPF | `oficina-api` (guard valida o JWT emitido pela Lambda) + API Gateway (JWT authorizer na rota protegida) | Parcial — já existe `jwt-auth.guard.ts`, mas validando o JWT admin, não o de CPF |
| 4 repositórios com CI/CD e branch protegida | Todos | Não |
| Banco de dados gerenciado | `oficina-infra-database` — RDS PostgreSQL (Free Tier: `db.t3.micro`, 20GB) | **Sim** — aplicado, schema Prisma migrado, aplicação principal conectada e respondendo `database: ok` em produção |
| Cluster Kubernetes com escalabilidade | EC2 `t3.small` + Kind (decisão final, atualizada após `t3.micro` se mostrar insuficiente sob carga — ver `docs/adr/0003-cluster-kubernetes-local.md`), HPA já existe na Fase 2 | **Sim** — cluster real no ar, aplicação implantada e respondendo via NodePort; falta validar o HPA sob carga real |
| Terraform para tudo | `oficina-infra-k8s`, `oficina-infra-database` | Parcial — já existe Terraform da Fase 2, precisa ser dividido e apontar para AWS |
| Datadog (latência, CPU/memória, healthcheck, alertas, logs JSON correlacionados) | `oficina-api` + infra | Não |
| Dashboards (volume diário de OS, tempo médio por status, erros) | Datadog | Não |
| Diagrama de Componentes | Documentação | Não (existe `docs/architecture.md` da Fase 2, precisa evoluir) |
| Diagrama de Sequência (auth + abertura de OS) | Documentação | Não |
| RFCs | Documentação | Não |
| ADRs | Documentação (este arquivo é o embrião) | Em andamento |
| Justificativa do banco + diagrama ER | Documentação | Parcial — schema Prisma existe, falta ER formal e justificativa |
| Vídeo demo (15 min) | Entrega final | Não |
| PDF de entrega com links dos 4 repos + vídeo + docs + `soat-architecture` | Entrega final | Não |

## Roteiro de trabalho proposto

1. ~~Validação de ambiente AWS~~ — feito: conta pessoal Free Tier criada, região `us-east-2` (Ohio).
2. **Documentação de decisões (RFCs/ADRs)** — registrar por escrito as decisões já tomadas nesta conversa antes de implementar (nuvem, banco, auth, roteamento do gateway, cluster local, HPA, padrão de comunicação). Em andamento em `docs/rfc/` e `docs/adr/`.
3. **Split dos repositórios** — criar os 4 repositórios no GitHub, migrar código/infra correspondente, configurar proteção de branch e PR obrigatório.
4. **Banco gerenciado** — Terraform para RDS Postgres (`db.t3.micro`, Free Tier) em `oficina-infra-database`; migrar schema Prisma.
5. **Cluster Kubernetes** — manter Kind local (decisão tomada, ver ADR-0003); Terraform em `oficina-infra-k8s` fica restrito a provisionar os recursos AWS gerenciados (Lambda, API Gateway, RDS), não o cluster em si.
6. **Lambda de autenticação por CPF** — novo serviço serverless, reaproveitando a validação de CPF já existente no domínio `customers`; retorna JWT via `jsonwebtoken` (não Cognito).
7. **API Gateway** — Terraform com rotas explícitas (auth, health) + proxy protegido por JWT authorizer para a API principal (ver ADR-0004).
8. **Ajuste da API principal** — trocar o guard de JWT atual para validar o token emitido pela Lambda; ajustar CI/CD do repo `oficina-api`.
9. **Datadog** — instrumentação da API (latência, métricas de K8s, logs estruturados JSON com correlation ID), alertas, dashboards.
10. **Diagramas e documentação restante** — diagrama de componentes, diagrama de sequência, diagrama ER + justificativa do banco, README por repositório.
11. **Vídeo demo e entrega** — gravar demonstração dos itens exigidos, montar o PDF de entrega, adicionar `soat-architecture` aos 4 repositórios.

## Riscos e pontos em aberto

- **EKS não é Free Tier** (~US$0,10/h de control plane, ~US$73/mês) — decidido manter Kind local em vez de EKS (ADR-0003) para não gerar custo real numa conta pessoal sem crédito institucional.
- Limites do Free Tier pessoal (RDS `db.t3.micro` 750h/mês, Lambda 1M invocações/mês, API Gateway 1M chamadas/mês nos primeiros 12 meses) são folgados para o escopo do desafio, mas é preciso lembrar de destruir recursos (`terraform destroy`) fora das janelas de uso/demo para não estourar 750h/mês se houver múltiplos recursos EC2/RDS simultâneos.
- Região deve ficar consistente (`us-east-2`) em todos os módulos Terraform para evitar custo de tráfego entre regiões e simplificar troubleshooting.
- Nenhum trabalho de Fase 3 foi iniciado no repositório atual; este plano parte do zero sobre a base sólida deixada pela Fase 2.
