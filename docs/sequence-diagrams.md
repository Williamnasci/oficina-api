# Diagramas de Sequência — Fase 3

## 1. Autenticação por CPF

Fluxo da Lambda de autenticação (`oficina-lambda-auth`), reaproveitando a lógica de domínio de `find-customer-by-document.use-case.ts`.

```mermaid
sequenceDiagram
    actor Cliente
    participant GW as API Gateway
    participant Lambda as Lambda Auth
    participant RDS as RDS PostgreSQL
    participant SM as Secrets Manager

    Cliente->>GW: POST /auth/login { document: "CPF" }
    GW->>Lambda: invoke (rota pública, sem authorizer)
    Lambda->>Lambda: valida formato do CPF (CustomerDocument VO)

    alt CPF inválido
        Lambda-->>GW: 400 Bad Request
        GW-->>Cliente: 400 Bad Request
    else CPF válido
        Lambda->>RDS: SELECT * FROM "Customer" WHERE document = :cpf

        alt cliente não encontrado
            RDS-->>Lambda: nenhuma linha
            Lambda-->>GW: 404 Not Found
            GW-->>Cliente: 404 Not Found
        else cliente inativo
            RDS-->>Lambda: customer (isActive = false)
            Lambda-->>GW: 403 Forbidden
            GW-->>Cliente: 403 Forbidden
        else cliente ativo
            RDS-->>Lambda: customer (isActive = true)
            Lambda->>SM: resolve segredo de assinatura (runtime, {{resolve:secretsmanager:...}})
            SM-->>Lambda: segredo (não persiste em log/contexto)
            Lambda->>Lambda: assina JWT HS256 { sub: customer.id, document, exp }
            Lambda-->>GW: 200 { access_token }
            GW-->>Cliente: 200 { access_token }
        end
    end
```

## 2. Abertura de Ordem de Serviço (rota protegida)

Fluxo completo desde a requisição autenticada até a persistência, espelhando `open-service-order.use-case.ts`.

```mermaid
sequenceDiagram
    actor Cliente
    participant GW as API Gateway
    participant AZ as Lambda Authorizer
    participant SM as Secrets Manager
    participant App as oficina-api (NestJS, K8s)
    participant RDS as RDS PostgreSQL

    Cliente->>GW: POST /service-orders<br/>Authorization: Bearer {jwt}
    GW->>AZ: autoriza requisição (rota protegida — ADR-0004)
    AZ->>SM: resolve segredo (cache local, TTL curto)
    AZ->>AZ: verifica assinatura HS256 e expiração do JWT

    alt token inválido/expirado
        AZ-->>GW: Deny
        GW-->>Cliente: 401 Unauthorized
    else token válido
        AZ-->>GW: Allow (contexto: customerId)
        GW->>App: proxy POST /service-orders (body original)

        App->>RDS: SELECT * FROM "Customer" WHERE document = :document
        alt cliente não existe
            App->>RDS: INSERT INTO "Customer" (...)
        else cliente inativo
            App-->>GW: 400/DomainException
            GW-->>Cliente: 400 Bad Request
        end

        App->>RDS: SELECT * FROM "Vehicle" WHERE "licensePlate" = :placa
        alt veículo não existe
            App->>RDS: INSERT INTO "Vehicle" (...)
        else veículo pertence a outro cliente
            App-->>GW: 400/DomainException
            GW-->>Cliente: 400 Bad Request
        end

        App->>RDS: INSERT INTO "ServiceOrder" (status = RECEIVED)
        loop para cada serviço do payload
            App->>RDS: INSERT INTO "ServiceOrderService" (serviceId, quantity, unitPrice, totalPrice)
        end
        loop para cada item de estoque do payload
            App->>RDS: INSERT INTO "ServiceOrderStockItem" (stockItemId, quantity, unitPrice, totalPrice)
        end

        App-->>GW: 201 { id }
        GW-->>Cliente: 201 { id }
    end
```

## Notas

- O Lambda Authorizer não reemite nem revalida contra o banco — ele só verifica a assinatura do token já emitido pela Lambda de auth, usando o mesmo segredo (ver [RFC-0003](rfc/0003-estrategia-de-autenticacao.md)).
- `findOrCreateCustomer`/`findOrCreateVehicle` no `OpenServiceOrderUseCase` real (`src/modules/service-orders/application/use-cases/open-service-order.use-case.ts`) fazem *find-or-create*: se o cliente/veículo já existir, reaproveita; se não, cria. O diagrama acima reflete esse comportamento em vez de assumir que o cliente já existe.
- O PDF exige logs estruturados em JSON com correlação entre requisições. Isso ainda não existe no código (`docs/observability.md` documenta só Prometheus/Grafana da Fase 2) — a implementação prevista é propagar um `correlationId` a partir do API Gateway até `App` e `Lambda`, para permitir rastrear uma requisição do cliente através de Gateway → Authorizer → aplicação nos dashboards do Datadog.
