# oficina-api

> Repositório renomeado na Fase 3 (era `oficina-tech-challenge`) para refletir seu papel dentro do split de 4 repositórios exigido pelo desafio — ver [ADR-0005](docs/adr/0005-split-de-repositorios.md).

## Repositórios do Tech Challenge Fase 3

Este é o repositório da **aplicação principal**. Os demais componentes da Fase 3 vivem em repositórios separados, cada um com seu próprio CI/CD e branch `main` protegida:

| Repositório | Papel |
|---|---|
| [`oficina-api`](https://github.com/Williamnasci/oficina-api) (este) | Aplicação principal (NestJS), executando em Kubernetes |
| [`oficina-lambda-auth`](https://github.com/Williamnasci/oficina-lambda-auth) | Function Serverless de autenticação por CPF |
| [`oficina-infra-k8s`](https://github.com/Williamnasci/oficina-infra-k8s) | Terraform: cluster Kubernetes (Kind em EC2) e API Gateway |
| [`oficina-infra-database`](https://github.com/Williamnasci/oficina-infra-database) | Terraform: banco de dados gerenciado (RDS PostgreSQL) |

Decisões arquiteturais completas (RFCs, ADRs, diagramas) ficam em [`docs/`](docs/) neste repositório: [plano da Fase 3](docs/phase-3-plan.md), [diagrama de componentes](docs/architecture-components.md), [diagramas de sequência](docs/sequence-diagrams.md), [diagrama ER](docs/database-er.md).

### Ambiente publicado

- **API Gateway (entrada pública)**: `https://lux3dot3qh.execute-api.us-east-1.amazonaws.com` — `POST /auth/login` (público, emite JWT via `oficina-lambda-auth`), `GET /health` (público), `ANY /{proxy+}` (protegido pelo Lambda Authorizer, encaminha para a aplicação).
- **Dashboard Datadog**: [Oficina API - Visão Geral](https://us5.datadoghq.com/dashboard/k2b-3e2-bz4/oficina-api---visao-geral) — volume de OS, tempo médio por status, erros de integração, latência, healthcheck.
- **Conta AWS**: sandbox do AWS Academy Learner Lab (ver [ADR-0007](docs/adr/0007-migracao-aws-academy.md)), não uma conta pessoal — orçamento fixo de USD 50 para todo o curso, sessão de lab expira em ~4h, e a própria plataforma frequentemente para/reinicia a EC2 do cluster (`oficina-infra-k8s`) entre sessões, o que muda o IP público (sem Elastic IP, decisão consciente de custo). Se o endpoint acima não responder, é porque a sessão do lab não está ativa no momento — não é um recurso sempre-ligado.

## Descrição do Projeto

Sistema back-end para gestão de oficinas mecânicas, desenvolvido como entrega do **Tech Challenge Fase 2** da Pós-Tech FIAP em Arquitetura de Software.

A aplicação centraliza o fluxo operacional de uma oficina, contemplando cadastro de clientes, veículos, ordens de serviço, catálogo de serviços, controle de estoque de peças e insumos, orçamento e acompanhamento do ciclo de vida da ordem de serviço.

## Objetivo

O sistema foi projetado para apoiar os principais processos de uma oficina mecânica:

- Cadastro e gestão de clientes com CPF/CNPJ.
- Cadastro e gestão de veículos.
- Criação e acompanhamento de ordens de serviço.
- Registro de diagnóstico técnico.
- Inclusão de serviços e peças em ordens de serviço.
- Controle de estoque com baixa automática.
- Cálculo de orçamento.
- Fluxo de aprovação e evolução de status.
- Notificação externa das mudanças de status por webhook configurável.
- Métricas operacionais de tempo médio de execução.

## Tecnologias Utilizadas

| Tecnologia | Função |
|------------|--------|
| Node.js 22 + TypeScript | Runtime e tipagem estática |
| NestJS | Framework principal da API |
| Prisma ORM | Persistência type-safe |
| PostgreSQL (RDS gerenciado em produção, Fase 3) | Banco de dados relacional |
| Swagger | Documentação da API |
| Jest + Supertest | Testes automatizados |
| Docker | Containerização da aplicação |
| Docker Compose | Orquestração local da API e do banco |
| Kubernetes | Orquestração da aplicação — cluster real (EC2 + Kind) em produção, Kind local para desenvolvimento |
| Terraform | Infraestrutura como Código (provisionamento real dividido entre `oficina-infra-k8s` e `oficina-infra-database`) |
| AWS API Gateway | Entrada pública, roteamento e proteção de rotas sensíveis (Fase 3) |
| GitHub Actions | Pipeline de CI/CD |
| Trivy | Análise de vulnerabilidades |
| Helm | Instalação do Datadog Agent no cluster (Fase 3) |
| Datadog (`dd-trace`, `nestjs-pino`) | APM, logs estruturados correlacionados e métricas de negócio em produção (Fase 3) |
| Prometheus + Grafana | Observabilidade local via Docker Compose (Fase 2, sem depender de conta Datadog) |
| Helmet + Passport (`passport-jwt`) | Cabeçalhos de segurança HTTP e estratégia de autenticação JWT |

## Arquitetura do Sistema

O projeto segue uma organização modular inspirada em DDD, Clean Architecture e arquitetura em camadas:

- **Domain:** entidades, value objects, enums, regras de negócio e contratos de repositório.
- **Application:** casos de uso, DTOs e mappers.
- **Infrastructure:** implementações Prisma dos repositórios e integrações técnicas.
- **Interfaces/HTTP:** controllers REST, Swagger, guards e DTOs de entrada.
- **Shared:** infraestrutura compartilhada, PrismaService e filtros globais.

As regras centrais ficam no domínio e nos casos de uso. Detalhes como HTTP, Swagger, Prisma, Docker, Kubernetes e Terraform ficam nas camadas externas ou na infraestrutura do projeto.

## Funcionalidades

### Customers

- Cadastro com validação de CPF/CNPJ.
- Consulta por ID ou documento.
- Listagem, atualização e exclusão lógica.

### Vehicles

- Cadastro com validação de placa.
- Vínculo com cliente.
- Listagem, atualização e exclusão lógica.

### Service Orders

- Criação vinculada a cliente e veículo ativos.
- Abertura completa com cliente, veículo, serviços e peças.
- Registro de diagnóstico.
- Adição de serviços e itens de estoque.
- Cálculo automático de orçamento.
- Aprovação ou recusa de orçamento.
- Consulta de status.
- Listagem operacional.
- Métrica de tempo médio de execução.

Fluxo de status:

```text
RECEIVED -> IN_DIAGNOSIS -> WAITING_APPROVAL -> APPROVED -> IN_PROGRESS -> FINISHED -> DELIVERED
```

### Stock Items

- Cadastro de peças e insumos.
- SKU único.
- Baixa automática de estoque.
- Listagem, atualização e exclusão lógica.

### Service Catalog

- Cadastro de serviços.
- Preço e descrição.
- Listagem, atualização e exclusão lógica.

## Documentação dos Endpoints da API

As rotas da API estão descritas de forma interativa no Swagger. Os quatro endpoints abaixo eram o requisito obrigatório definido na Fase 2 e continuam sendo o núcleo funcional da aplicação — nenhuma regra de negócio ou contrato mudou na Fase 3, que adicionou autenticação por CPF, API Gateway e observabilidade em torno dessas mesmas rotas, sem alterá-las:

### 1. Abertura Completa de Ordem de Serviço (OS)
- **Método/Rota**: `POST /service-orders/opening`
- **Autenticação**: Requer Bearer Token (JWT)
- **Descrição**: Abre uma nova OS vinculando cliente, veículo, serviços e peças. Retorna o ID único gerado para a OS.
- **Payload de Exemplo**:
  ```json
  {
    "customer": {
      "name": "John Doe",
      "documentType": "CPF",
      "document": "52998224725",
      "phone": "11999999999",
      "email": "john@example.com"
    },
    "vehicle": {
      "licensePlate": "ABC1D23",
      "brand": "Toyota",
      "model": "Corolla",
      "year": 2022
    },
    "services": [
      {
        "serviceId": "88ef38db-e956-4e26-807e-e709b87c25af",
        "quantity": 1
      }
    ],
    "stockItems": [
      {
        "stockItemId": "90a44f7f-6798-44f8-8c23-d6d20dcd4ed0",
        "quantity": 2
      }
    ]
  }
  ```
- **Resposta**: `201 Created` com `{ "id": "uuid-da-os" }`

### 2. Consulta de Status da OS
- **Método/Rota**: `GET /service-orders/:id/status`
- **Descrição**: Informa a situação atual da OS especificada pelo ID.
- **Resposta**: `200 OK`
  ```json
  {
    "status": "RECEIVED"
  }
  ```
  *(Status possíveis: RECEIVED, IN_DIAGNOSIS, WAITING_APPROVAL, APPROVED, IN_PROGRESS, FINISHED, DELIVERED)*

### 3. Decisão Externa de Orçamento (Aprovação/Recusa)
- **Método/Rota**: `POST /service-orders/:id/budget-decision`
- **Descrição**: Endpoint para receber notificações externas de aprovação ou recusa do orçamento do cliente.
- **Payload de Exemplo**:
  ```json
  {
    "decision": "APPROVED"
  }
  ```
- **Resposta**: `204 No Content`

### 4. Listagem Operacional de Ordens de Serviço (Fila de Trabalho)
- **Método/Rota**: `GET /service-orders/operational-queue`
- **Autenticação**: Requer Bearer Token (JWT)
- **Descrição**: Retorna a listagem de ordens de serviço ativas na oficina com ordenação estrita por prioridade de status (`IN_PROGRESS` > `APPROVED` > `WAITING_APPROVAL` > `IN_DIAGNOSIS` > `RECEIVED`) e as mais antigas primeiro. Exclui logicamente ordens finalizadas (`FINISHED`) e entregues (`DELIVERED`).
- **Resposta**: `200 OK` com a lista ordenada de OS.

### Outros Payloads de Exemplo

Os quatro endpoints acima cobrem o requisito obrigatório da Fase 2. Os exemplos abaixo cobrem os demais recursos do CRUD, complementando a documentação interativa do Swagger.

**Cadastro de Cliente** — `POST /customers` (Bearer Token)
```json
{
  "name": "John Doe",
  "documentType": "CPF",
  "document": "52998224725",
  "phone": "11999999999",
  "email": "john@example.com"
}
```

**Cadastro de Veículo** — `POST /vehicles` (Bearer Token)
```json
{
  "customerId": "18201d07-08aa-4e2f-ae0e-35a06e0e5e49",
  "licensePlate": "ABC1234",
  "brand": "Toyota",
  "model": "Corolla",
  "year": 2022
}
```

**Cadastro de Item de Estoque** — `POST /stock-items` (Bearer Token)
```json
{
  "name": "Pastilha de freio",
  "description": "Jogo de pastilhas dianteiras",
  "sku": "PF-001",
  "quantity": 10,
  "unitPrice": 200.0,
  "isActive": true
}
```

**Cadastro de Serviço no Catálogo** — `POST /service-catalog` (Bearer Token)
```json
{
  "name": "Troca de óleo",
  "description": "Troca de óleo do motor",
  "price": 150.0,
  "isActive": true
}
```

**Registro de Diagnóstico** — `PATCH /service-orders/:id/diagnosis` (Bearer Token)
```json
{
  "diagnosis": "Engine oil leak identified during inspection."
}
```

**Inclusão de Serviço na OS** — `POST /service-orders/:id/services` (Bearer Token)
```json
{
  "serviceId": "3d2c40cb-21b7-4e0e-84f5-22f5e79b6b12",
  "quantity": 1
}
```

**Inclusão de Peça na OS** — `POST /service-orders/:id/stock-items` (Bearer Token)
```json
{
  "stockItemId": "c0f6d9b0-6d8a-4e0f-a0b0-3d4b9f6c2a11",
  "quantity": 2
}
```

Os demais endpoints (`GET`, `PATCH` de atualização e `DELETE` de cada recurso, além das transições de status da OS como `send-budget`, `approve-budget`, `finish`, `deliver` e `start-execution`) seguem o mesmo padrão de autenticação e validação, e estão detalhados com todos os campos, exemplos e respostas possíveis no Swagger.

### Documentação Swagger

A especificação OpenAPI / Swagger pode ser acessada localmente após iniciar a aplicação:
- **Swagger URL**: `http://localhost:3000/docs`

> [!NOTE]
> Para testar os endpoints protegidos por autenticação no Swagger, acesse a rota `POST /auth/login` com o usuário de demonstração acadêmica (`admin` / `admin`), copie o token JWT gerado e insira-o clicando no botão **Authorize** (formato: `Bearer <token>`).

> [!IMPORTANT]
> **O Swagger não é acessível pela URL pública do API Gateway.** Pelo roteamento híbrido decidido no [ADR-0004](docs/adr/0004-api-gateway-roteamento.md), só `POST /auth/login` e `GET /health` são rotas públicas — `GET /docs` cai em `ANY /{proxy+}`, protegida pelo Lambda Authorizer, então um `GET` direto do navegador (sem `Authorization: Bearer`) recebe `401`. Isso é intencional: o Gateway mantém a superfície pública mínima por desenho, o mesmo motivo pelo qual [o painel de demonstração](public/index.html) também não é servido pela URL pública. Para acessar o Swagger contra o ambiente real (não local), use `kubectl port-forward svc/oficina-api <porta>:80 -n oficina` e abra `http://localhost:<porta>/docs` — mesma técnica usada para o painel.

---

## Vídeo de Demonstração

https://youtu.be/m2baUQXCOUw

---

## Desenho da Arquitetura e Fluxo de Deploy

O desenho abaixo resume os componentes da aplicação, a infraestrutura provisionada na AWS (AWS Academy Learner Lab — ver [ADR-0007](docs/adr/0007-migracao-aws-academy.md)) e o fluxo automatizado de entrega da Fase 3. Cada bloco de infraestrutura é provisionado por um dos 4 repositórios do desafio — ver a tabela no topo deste README.

```mermaid
flowchart LR
    dev[Desenvolvedor] --> repo["oficina-api (GitHub)"]
    repo --> actions[GitHub Actions]

    subgraph CICD["CI/CD - oficina-api"]
      actions --> quality[Build, Prisma Migrate e Testes]
      quality --> docker[Docker Build e Push]
      docker --> hub[Docker Hub]
      quality --> trivy["Trivy (imagem + filesystem)"]
      quality --> k8sValidate[kubectl kustomize k8s]
      docker --> deploy[Deploy to Kubernetes]
      k8sValidate --> deploy
      deploy --> ddHelm["Deploy Datadog Agent (Helm)"]
    end

    client[Cliente] -->|HTTPS| loginRoute
    client -->|HTTPS| healthRoute
    client -->|"HTTPS + Bearer JWT"| protectedRoute

    subgraph AWS["AWS - AWS Academy Learner Lab (us-east-1)"]
      subgraph GW["API Gateway HTTP API v2 (oficina-infra-k8s) - ADR-0004"]
        loginRoute["POST /auth/login (publica)"]
        healthRoute["GET /health (publica)"]
        protectedRoute["ANY /{proxy+} (protegida)"]
      end

      lambdaAuth["Lambda de Autenticacao (oficina-lambda-auth)"]
      authorizer[Lambda Authorizer]
      loginRoute --> lambdaAuth
      protectedRoute --> authorizer

      subgraph K8S["EC2 t3.small - Cluster Kind (oficina-infra-k8s) - ADR-0003"]
        apiDeploy[Deployment oficina-api]
        apiDeploy --> hpa["HPA (2-6 replicas)"]
        apiDeploy --> svcApi[Service oficina-api]
      end

      authorizer -->|autorizado| svcApi
      healthRoute --> svcApi
      deploy --> apiDeploy
      hub --> apiDeploy

      rds[("RDS PostgreSQL (oficina-infra-database)")]
      lambdaAuth --> rds

      ddAgent["Datadog Agent (DaemonSet)"]
      ddHelm --> ddAgent
    end

    svcApi --> api[NestJS API]
    api --> prisma[Prisma ORM]
    prisma --> rds
    api --> statusChange[Status da OS alterado]
    statusChange --> notification[Notificacao de status]
    notification --> webhook[Webhook externo configuravel]
    webhook --> email[Servico de e-mail para o cliente]

    api --> health[Health check]
    api --> metrics["Metricas /metrics"]
    ddAgent --> metrics
    ddAgent -.->|traces, logs JSON, metricas| datadog[Datadog]
    datadog --> dashboards[Dashboards e Alertas]
```

---

## Infraestrutura Implementada

### Docker

- `Dockerfile` multi-stage com Node.js 22 Alpine.
- Geração do Prisma Client durante o build.
- Runtime com usuário não root.
- API exposta na porta `3000`.

### Docker Compose

- API NestJS.
- PostgreSQL 15 em container.
- Volume persistente para o banco.
- Healthcheck do PostgreSQL.
- Healthcheck da API em `/health`.
- Execução das migrations Prisma antes da inicialização da API.
- Prometheus coletando métricas em `/metrics`.
- Grafana provisionado com datasource Prometheus e dashboard inicial.

Para acesso ao PostgreSQL pelo host local, o Compose expõe o banco em `localhost:15432`.
Essa é a porta oficial do PostgreSQL para execução local fora dos containers.

### Observabilidade Local

O Docker Compose inclui uma solução mínima viável de observabilidade, usada só para desenvolvimento local — a fonte de observabilidade em produção é o Datadog, detalhado na seção [Observabilidade](#observabilidade) mais abaixo.

- API NestJS expondo métricas Prometheus em `/metrics`.
- Prometheus em `http://localhost:9090`.
- Grafana em `http://localhost:3001` com login `admin` / `admin`.
- Dashboard inicial `Oficina API` com requisições, latência e health checks.

Arquivos principais:

- `monitoring/prometheus/prometheus.yml`.
- `monitoring/grafana/provisioning/datasources/prometheus.yml`.
- `monitoring/grafana/provisioning/dashboards/oficina.yml`.
- `monitoring/grafana/dashboards/oficina-api.json`.

### Kubernetes

Os manifests ficam em `k8s/` (validados via `kubectl kustomize k8s` no CI/CD e aplicados de fato pelo job `deploy` de `.github/workflows/ci-cd.yml` contra o cluster real) e incluem:

- Namespace `oficina`.
- ConfigMap (inclui as variáveis `DD_ENV`, `DD_SERVICE`, `DD_TRACE_AGENT_PORT`, `DD_LOGS_INJECTION` consumidas pelo `dd-trace`).
- Secret `oficina-secrets` (não versionado — criado em runtime pelo próprio job de deploy a partir dos GitHub Secrets).
- API Deployment, com `DD_AGENT_HOST` injetado via downward API (o Datadog Agent roda como DaemonSet, um por node).
- API Service.
- Readiness probe em `/health`.
- Liveness probe em `/health`.
- HPA por CPU e memória.

> **Não há mais Service/StatefulSet de PostgreSQL nesta pasta.** Na Fase 2, o banco rodava dentro do cluster (StatefulSet + PVC); na Fase 3, o banco é o RDS gerenciado (`oficina-infra-database`), fora do cluster — por isso esses manifests foram removidos, não é uma omissão.

Validação dos manifests:

```bash
kubectl kustomize k8s
```

### Terraform

> **Este `infra/terraform/` é o Terraform original da Fase 2** — cria um cluster Kind **local** e os workloads dentro dele (incluindo um StatefulSet de PostgreSQL em cluster). Ele continua no repositório e funcional para desenvolvimento/demonstração local, mas **não é o que provisiona o ambiente publicado da Fase 3**. A infraestrutura real (EC2 + Kind na AWS, API Gateway) é provisionada por Terraform no repositório [`oficina-infra-k8s`](https://github.com/Williamnasci/oficina-infra-k8s); o RDS PostgreSQL gerenciado é provisionado por Terraform no repositório [`oficina-infra-database`](https://github.com/Williamnasci/oficina-infra-database). Ver `infra/terraform/README.md` para o detalhamento completo deste Terraform local.

A implementação Terraform local fica em `infra/terraform/` e está dividida em duas etapas:

- `infra/terraform/cluster`: cria um cluster Kubernetes Kind local com um control plane e dois workers.
- `infra/terraform`: provisiona os workloads da aplicação no cluster criado.

O provisionamento dos workloads inclui:

- Namespace `oficina-terraform`.
- ConfigMap.
- Secret.
- PostgreSQL Service.
- PostgreSQL StatefulSet.
- PersistentVolumeClaim.
- API Deployment.
- API Service.
- HPA via `kubernetes_horizontal_pod_autoscaler_v2`.

Comandos principais para criar o cluster:

```bash
cd infra/terraform/cluster
terraform init
terraform apply
cd ..
```

Depois, para provisionar a aplicação e o banco:

```bash
cd infra/terraform
terraform init
terraform fmt -check
terraform validate
terraform plan
terraform apply
```

## Evidências de Validação

### Fase 2 (ambiente local)

Durante a consolidação da Fase 2, foram utilizados os seguintes comandos de validação contra o cluster Kind local (não o ambiente publicado da Fase 3):

```bash
npm run build
npm test -- --runInBand
docker build -t williamnasci/oficina-tech-challenge:test .
docker compose config
docker compose up --build
kubectl kustomize k8s
terraform validate
terraform plan
terraform apply
kubectl get pods -n oficina-terraform
kubectl get pvc -n oficina-terraform
kubectl get hpa -n oficina-terraform
```

A API também foi validada por port-forward:

```bash
kubectl port-forward svc/oficina-api 3000:80 -n oficina-terraform
curl http://localhost:3000/health
curl http://localhost:3000/metrics
```

### Fase 3 (ambiente publicado — verificado em 2026-08-20)

```bash
npm run build          # sucesso
npx tsc --noEmit        # sucesso
npm test -- --runInBand # 65 suítes / 232 testes, sucesso
curl https://<url-do-api-gateway>/health
```

Resultado real, obtido nesta verificação (2026-08-20T04:30:29Z):

```json
{"status":"ok","app":"ok","database":"ok","timestamp":"2026-08-20T04:30:29.248Z"}
```

> **Nota sobre disponibilidade:** durante esta mesma verificação, o endpoint público chegou a responder `503` mais cedo, porque a EC2 do cluster tinha trocado de IP público (stop/start do AWS Academy Learner Lab, sem Elastic IP — ver [ADR-0007](docs/adr/0007-migracao-aws-academy.md)) e o `integration_uri` do API Gateway (`oficina-infra-k8s`) ainda apontava para o IP anterior. Diagnosticado ao vivo (aplicação e RDS saudáveis via SSM Session Manager direto na EC2, `503` só no Gateway) e corrigido rodando `terraform apply` em `oficina-infra-k8s` — que já resolve isso sozinho, porque o `integration_uri` referencia o atributo `public_ip` do estado do Terraform, atualizado no refresh de qualquer `apply`, não só numa recriação da instância (`-replace`). Não é preciso destruir/recriar a EC2 para corrigir um IP desatualizado — só rodar `apply` de novo.

## HPA e Metrics Server

O `metrics-server` é instalado automaticamente no bootstrap do cluster (`user_data.sh.tpl` em `oficina-infra-k8s`, com `--kubelet-insecure-tls` — Kind usa certificado de kubelet self-signed que o metrics-server não valida por padrão), não precisa de passo manual.

O HPA (`k8s/06-hpa.yaml`) foi **validado sob carga real**: gerando tráfego concorrente contra o `/health` via API Gateway, o HPA escalou de 2 para 6 réplicas (o máximo configurado) com métricas reais de CPU lidas pelo metrics-server (`cpu: 84%/70%`). Um dos 6 pods ficou `Pending` por falta de CPU no node único `t3.small` — limitação esperada de um cluster single-node, não um bug do HPA.

Para reproduzir a carga manualmente:

```bash
kubectl apply -f k8s/demo/load-generator.yaml
kubectl get hpa,pods -n oficina -w
kubectl delete -f k8s/demo/load-generator.yaml
```

## Notificação Externa de Status

O requisito de atualização de status da OS via ferramenta externa foi implementado por uma porta de notificação configurável. Sempre que uma mudança de status relevante ocorre, a aplicação publica um evento HTTP para a URL definida em `STATUS_NOTIFICATION_WEBHOOK_URL`.

O evento enviado contém:

```json
{
  "serviceOrderId": "id-da-ordem",
  "status": "APPROVED",
  "occurredAt": "2026-07-14T00:00:00.000Z",
  "createdAt": "2026-07-14T00:00:00.000Z"
}
```

Durante a demonstração, essa integração pode ser validada com um receptor HTTP, como o webhook.site. Em um cenário real, a mesma URL pode apontar para uma ferramenta de automação ou serviço externo responsável por enviar e-mail ao cliente.

Se a variável não estiver configurada, a notificação é ignorada. Se o serviço externo estiver indisponível, a alteração de status já persistida não é revertida.

## CI/CD - GitHub Actions

O workflow fica em `.github/workflows/ci-cd.yml`.

Eventos:

- `push` na branch `main`.
- `pull_request` para `main`.
- execução manual por `workflow_dispatch`.

Jobs:

| Job | Objetivo |
|-----|----------|
| `quality` | Instala dependências, gera o Prisma Client, aplica migrations, executa build e testes |
| `docker` | Gera a imagem Docker e publica no Docker Hub apenas na `main` e fora de Pull Requests |
| `security` | Executa scan Trivy da imagem e do filesystem |
| `kubernetes-validate` | Renderiza os manifests com `kubectl kustomize k8s` |
| `deploy` | Executa deploy no Kubernetes na branch `main` (aplica manifests, atualiza o secret `oficina-secrets`, atualiza a imagem, força rollout restart, e instala/atualiza o Datadog Agent via Helm) |

O workflow também tem um `concurrency` group (`${{ github.workflow }}-${{ github.ref }}`, `cancel-in-progress: false`) — sem isso, um push automático e um `workflow_dispatch` manual quase simultâneos rodam o job `deploy` em paralelo contra o mesmo cluster, o que já causou uma falha real de deploy (`helm upgrade` concorrente, `release: already exists`).

Secrets necessários no GitHub:

```text
DOCKERHUB_USERNAME
DOCKERHUB_TOKEN
KUBE_CONFIG                       (cluster real da Fase 3 — ver oficina-infra-k8s)
DATABASE_URL                      (usado pelo job deploy para popular o secret oficina-secrets)
JWT_SECRET                        (compartilhado com oficina-lambda-auth)
AUTH_DEMO_PASSWORD                (senha do usuário de demonstração admin)
STATUS_NOTIFICATION_WEBHOOK_URL   (opcional — webhook de notificação de status)
DATADOG_API_KEY                   (se ausente/vazio, o deploy segue sem instalar o Datadog Agent, com aviso no resumo do run)
```

- `DOCKERHUB_USERNAME` e `DOCKERHUB_TOKEN` são usados para publicar imagem no Docker Hub;
- `KUBE_CONFIG` hoje aponta para o cluster real na AWS (EC2 + Kind, `oficina-infra-k8s`) — o job `deploy` roda num runner hospedado pelo GitHub (`ubuntu-latest`), não um runner self-hosted; a variável `DEPLOY_RUNNER` continua suportada como *fallback* (`runs-on: ${{ vars.DEPLOY_RUNNER || 'ubuntu-latest' }}`) para quem quiser rodar contra um cluster Kind local com um runner self-hosted, mas não é o modo usado no ambiente publicado da Fase 3;
- o deploy falha quando nenhum cluster acessível está configurado, evitando um falso sucesso da entrega contínua.

> **Sobre branch protection:** a `main` é protegida (sem commit direto, PR obrigatório, sem force-push/delete) e `enforce_admins` está ativo. Não há `required_status_checks` configurado — o merge não é bloqueado automaticamente se o CI estiver falhando. Risco aceito conscientemente para um projeto de mantenedor único (mesmo padrão de outros riscos documentados neste projeto), não uma omissão.


## SonarQube

O repositório mantém `sonar-project.properties` com fontes, testes, exclusões e leitura de cobertura Jest em `coverage/lcov.info`.

O serviço `sonarqube` no `docker-compose.yml` permite análise local/manual em `http://localhost:9000`. No pipeline atual, a análise efetivamente automatizada de segurança é feita pelo Trivy, enquanto cobertura e qualidade funcional são validadas por Jest, build TypeScript e testes automatizados.

## Segurança

Mitigações aplicadas na aplicação e na infraestrutura:

- JWT obrigatório via `JWT_SECRET`, com validação de dois emissores possíveis (token de demonstração local e token real emitido pela Lambda de autenticação por CPF, mesmo segredo).
- Guard de posse/papel: uma ordem de serviço só pode ser consultada por quem é dono dela ou por um administrador.
- Helmet aplicado globalmente.
- CORS configurável por variável de ambiente.
- TLS obrigatório na conexão com o RDS, com validação real de identidade do servidor via bundle oficial de CA da AWS (`rejectUnauthorized: true`) — ver [ADR-0006](docs/adr/0006-acesso-rede-rds-fora-vpc.md).
- Docker executando como usuário não root (`USER node`), com exposição apenas das portas necessárias.
- Validação de entrada com `ValidationPipe` (`whitelist` e `forbidNonWhitelisted`).
- Endpoint `/metrics` sem exposição de dados sensíveis, apenas métricas técnicas agregadas.
- Scan de dependências (`npm audit`) e de imagem/filesystem (Trivy) executados no pipeline de CI/CD, com achados registrados no log (`exit-code: '0'`, finalidade informativa nesta fase acadêmica).

### Resultado da última análise (2026-08-20, após `npm audit fix`)

| Ferramenta | CRITICAL | HIGH | MEDIUM/MODERATE | LOW |
|------------|----------|------|------------------|-----|
| `npm audit` (dependências de produção) | 0 | 3 | 0 | 0 |
| Trivy filesystem (`package-lock.json`) | 0 | 1 | 0 | — |
| Trivy imagem (`oficina-tech-challenge`, build local) | 0 | 4 | 6 | — |

Antes de rodar `npm audit fix`, o resultado era bem pior — até 8 HIGH / 12 MEDIUM na imagem Docker, contra o "0 HIGH, 0 CRITICAL" que a versão anterior (julho/2026) desta seção reportava. `npm audit fix` (sem `--force`, sem downgrade de major version) resolveu 8 das 11 vulnerabilidades de dependência de produção, revalidado com sucesso: `npm run build`, `npx tsc --noEmit` e a suíte completa (**65 suítes / 232 testes**) passando após o fix e `npx prisma generate`.

As **3 HIGH restantes** (`prisma`, `@prisma/config`, `deepmerge-ts` — stack exhaustion em merge recursivo, [GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx)) só têm correção via `npm audit fix --force`, que rebaixaria o Prisma para `6.12.0` — downgrade de major version não aplicado sem decisão explícita e reteste completo de migrations/schema.

O detalhamento anterior (investigação por achado, recomendações) está em `docs/security-report.md` — desatualizado frente ao resultado acima, precisa de nova rodada.

## Como Executar Localmente

Configure o arquivo `.env`:

```env
DATABASE_URL="postgresql://postgres:supersecretpassword@localhost:15432/oficina_db?schema=public"
JWT_SECRET=sua_chave_secreta_aqui
JWT_EXPIRES_IN=1d
AUTH_DEMO_USERNAME=admin
AUTH_DEMO_PASSWORD=admin
STATUS_NOTIFICATION_WEBHOOK_URL=
CORS_ORIGIN=http://localhost:3000
PORT=3000
```

### Fluxo Docker Completo

Use este fluxo quando quiser subir API, banco, SonarQube, Prometheus e Grafana em containers:

```bash
docker compose up -d --build
```

Serviços principais:

- API: `http://localhost:3000`
- Health check: `http://localhost:3000/health`
- Métricas Prometheus: `http://localhost:3000/metrics`
- Swagger: `http://localhost:3000/docs`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3001`
- SonarQube: `http://localhost:9000`

### Fluxo Desenvolvimento Local

Use este fluxo quando quiser rodar a API pelo NestJS local e apenas o banco em container:

```bash
npm install
docker compose up -d db
npm run start:dev
```

Neste modo, evite subir o serviço `api` do Compose ao mesmo tempo para não disputar a porta `3000`.

Acesse:

- API: `http://localhost:3000`
- Health check: `http://localhost:3000/health`
- Métricas Prometheus: `http://localhost:3000/metrics`
- Swagger: `http://localhost:3000/docs`

## Autenticação

Rota pública:

```http
POST /auth/login
```

Payload de demonstração:

```json
{
  "username": "admin",
  "password": "admin"
}
```

Use o token retornado como Bearer Token no Swagger.

> **Nota (Fase 3):** essa é a rota de login local/demo (`admin`/`admin`, útil pra testar direto no Swagger). No ambiente publicado via API Gateway, a autenticação real é por CPF, emitida pela função Lambda `oficina-auth-login` (ver `oficina-lambda-auth`) — o guard deste serviço (`jwt.strategy.ts`) valida os dois tipos de token, porque o `JWT_SECRET` é compartilhado com a Lambda (mesmo segredo no Secrets Manager).

## Testes

O projeto possui testes automatizados unitários, de integração e end-to-end (e2e) para os fluxos principais da aplicação.

### Tipos de teste

| Tipo | Local | O que cobre |
|------|-------|--------------|
| Unitário | `test/unit/**` (58 suítes / 191 testes) | Entidades e value objects de domínio, casos de uso (application), controllers e repositórios Prisma isolados com mocks/stubs |
| Integração | `test/integration/**` (5 suítes / 25 testes) | Controllers via Supertest com módulo Nest completo (`AppModule`), incluindo o fluxo transacional de orçamento e baixa de estoque de uma OS ponta a ponta contra um banco real |
| E2E | `test/app.e2e-spec.ts` (1 suíte / 1 teste) | Bootstrap completo da aplicação e smoke test de disponibilidade (`GET /`) |

### Cobertura de código

Validação local recente com `npm run test:cov`:

- 63 suítes / 216 testes executados via `npm test` (unitários + integração).
- 1 suíte / 1 teste adicional via `npm run test:e2e`.

| Métrica | Cobertura |
|---------|-----------|
| Statements | 94.43% |
| Branches | 77.57% |
| Functions | 95.10% |
| Lines | 93.91% |

As camadas de domínio e aplicação (entidades, value objects e casos de uso) concentram a maior cobertura, por conterem as regras de negócio centrais. A cobertura de *branches* é menor principalmente pelos ramos defensivos dos repositórios Prisma e por caminhos de erro pouco prováveis, mais custosos de simular em teste do que de tratar no código.

Comandos:

```bash
npm test              # testes unitários e de integração
npm run test:cov      # testes unitários e de integração com relatório de cobertura (coverage/)
npm run test:e2e      # teste end-to-end (bootstrap completo da aplicação)
npm run test:integration:db   # fluxo transacional de orçamento/estoque contra banco real
```

## Documentação Complementar

| Documento | Local |
|-----------|-------|
| Arquitetura | `docs/architecture.md` |
| Bounded Contexts | `docs/bounded-contexts.md` |
| Domain Storytelling | `docs/domain-storytelling.md` |
| Event Storming | `docs/event-storming.md` |
| Linguagem Ubíqua | `docs/ubiquitous-language.md` |
| Kubernetes | `docs/kubernetes.md` |
| Terraform | `infra/terraform/README.md` |
| Observabilidade | `docs/observability.md` |
| Histórico da Fase 2 | `docs/phase-2-plan.md` |
| Segurança | `docs/security-report.md` |

## Observabilidade

### Datadog (Fase 3, produção)

- **APM (latência/tracing)**: `dd-trace` inicializado antes de qualquer outro import em `main.ts`, só ativa quando `DD_AGENT_HOST` está definido (não tenta conectar em dev/testes).
- **Logs JSON estruturados com correlation ID**: `nestjs-pino` substitui o logger padrão do Nest; cada requisição ganha um `req.id`, e o `dd-trace` injeta `dd.trace_id`/`dd.span_id` quando ativo — correlaciona log com trace no Datadog.
- **Métricas de negócio**: `service_orders_created_total` (volume de OS), `service_order_time_to_status_seconds` labeled por status (tempo médio até cada status), `integration_errors_total` (erros do webhook de notificação) — reaproveitam o endpoint `/metrics` Prometheus já existente, scrapado pelo Datadog Agent (`prometheusScrape.enabled`).
- **Datadog Agent**: instalado via Helm no CI/CD (`clusterAgent` desabilitado — cluster single-node pequeno não precisa de agregação cluster-wide), como DaemonSet no mesmo node da aplicação (`DD_AGENT_HOST` via downward API `status.hostIP`).
- **Dashboard**: [Oficina API - Visão Geral](https://us5.datadoghq.com/dashboard/k2b-3e2-bz4/oficina-api---visao-geral) — volume diário de OS, tempo médio por status, erros de integração, latência média, healthcheck.
- **Monitors/alertas**: healthcheck falhando (`healthcheck_status < 1` por 5min), erros de integração acima do normal (`> 5` em 15min), falha no processamento de ordens de serviço (`> 3` respostas 5xx em `/service-orders*` em 15min — cobre a rota em si, não só a integração externa).

### Prometheus (Fase 2, local)

- `/health` para saúde da aplicação e banco.
- `/metrics` no formato Prometheus (mesma fonte que o Datadog Agent scrapa em produção).
- Prometheus e Grafana no Docker Compose, para inspeção local sem depender de uma conta Datadog.

OpenTelemetry, Loki e Jaeger foram avaliados e descartados para não introduzir complexidade duplicada — o Datadog já cobre APM, logs e métricas num único agente. A proposta arquitetural original (Fase 2) está descrita em `docs/observability.md`.

## Autoria

Projeto desenvolvido como entrega do Tech Challenge da Pós-Tech FIAP em Arquitetura de Software — Fase 2 (base funcional: NestJS, Prisma, Docker, CI/CD, Kubernetes local) e Fase 3 (evolução para nuvem: split em 4 repositórios, RDS, Lambda de autenticação por CPF, API Gateway, Terraform, Datadog).
