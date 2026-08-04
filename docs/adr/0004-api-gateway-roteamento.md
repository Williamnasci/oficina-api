# ADR-0004: Estratégia de roteamento no API Gateway (proxy híbrido)

**Status:** Aceita
**Data:** 2026-08-03

## Contexto

Discussão levantada por um colega de turma no fórum da disciplina: o API Gateway deve ser a fonte da verdade das rotas (API First — todo endpoint declarado explicitamente via OpenAPI ou Terraform), ou deve atuar como proxy, deixando o roteamento a cargo da aplicação?

O NestJS já gera Swagger/OpenAPI automaticamente via decorators. Duplicar cada rota manualmente em Terraform (`aws_apigatewayv2_route` por endpoint) ou manter um OpenAPI paralelo no repositório do gateway cria dois pontos de manutenção para o mesmo contrato — risco de dessincronização toda vez que um endpoint muda na aplicação.

O requisito do desafio para o gateway é "controle e roteamento" e "proteger rotas sensíveis com autenticação via CPF" — não pede validação de schema por rota no nível do gateway.

## Alternativas consideradas

### A — API First total (OpenAPI ou Terraform declarando cada rota)
Prós: gateway como contrato único, validação de payload/rate limit por endpoint possível nativamente.
Contras: alto custo de manutenção (toda mudança de endpoint exige tocar o repositório do gateway); as extensões `x-amazon-apigateway-*` usadas para importar OpenAPI com integrações/authorizers embutidos são do **API Gateway REST API (v1)**, não do **HTTP API (v2)** — adotar esse caminho de verdade exigiria trocar de REST API v1 (mais caro, mais verboso) em vez do HTTP API v2 usado nos exemplos e no material do curso.
Descartada para o escopo do desafio — over-engineering frente ao que é avaliado, e teria custo/complexidade extra por forçar REST API v1.

### B — Proxy total (`ANY /{proxy+}` único, sem distinção de rota)
Prós: zero duplicação de roteamento, alinhado ao padrão comum de microsserviços atrás de gateway.
Contras: authorizer em HTTP API v2 é anexado por rota — um único proxy genérico protege tudo (incluindo login/health) ou nada. Não dá para diferenciar rota pública de rota protegida com uma única rota catch-all.
Descartada isoladamente — não atende ao requisito de proteger só as rotas sensíveis.

### C — Híbrido: poucas rotas explícitas (auth, health) + proxy protegido para o resto
Prós: resolve o problema da alternativa B (rotas públicas separadas das protegidas) sem pagar o custo de manutenção da alternativa A. A aplicação continua dona do seu próprio contrato (Swagger gerado pelos decorators); o gateway só decide *quem entra*, não *para onde cada endpoint interno vai*.

## Decisão

Alternativa C. Três grupos de rota no Terraform do API Gateway (HTTP API v2):

```hcl
# pública — Lambda de auth
resource "aws_apigatewayv2_route" "auth" {
  route_key = "POST /auth/login"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_auth.id}"
}

# pública — healthcheck
resource "aws_apigatewayv2_route" "health" {
  route_key = "GET /health"
  target    = "integrations/${aws_apigatewayv2_integration.app.id}"
}

# protegida — todo o resto da aplicação
resource "aws_apigatewayv2_route" "app_protected" {
  route_key          = "ANY /{proxy+}"
  target             = "integrations/${aws_apigatewayv2_integration.app.id}"
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.lambda_auth_verifier.id
}
```

**Correção importante em relação à primeira versão discutida no fórum:** `authorization_type = "JWT"` (authorizer nativo) só funciona com um issuer OIDC/JWKS (tipicamente Cognito ou Auth0). Como o token é assinado por uma Lambda própria com segredo simétrico (ver [[../rfc/0003-estrategia-de-autenticacao]]), o tipo correto é `authorization_type = "CUSTOM"` com um **Lambda Authorizer** (`aws_apigatewayv2_authorizer` do tipo `REQUEST`) que verifica a assinatura HS256 manualmente.

## Consequências

### Positivas
- Sem duplicação de contrato entre gateway e aplicação — apenas 2 rotas públicas explícitas, mantidas manualmente porque raramente mudam.
- Authorizer aplicado exatamente onde o requisito pede (rotas sensíveis), sem expor login/health atrás de autenticação.
- Compatível com HTTP API v2 (mais barato, alinhado ao módulo de Serverless do curso), sem forçar migração para REST API v1.

### Negativas / trade-offs aceitos
- Se novas rotas públicas (não-protegidas) forem necessárias no futuro, precisam ser adicionadas explicitamente ao Terraform do gateway — não é 100% "zero manutenção", mas o volume esperado é baixo (login, health, e pouco mais).
