# RFC-0003: Estratégia de autenticação (Function Serverless por CPF)

**Status:** Aceita
**Data:** 2026-08-03

## Resumo

Implementar a autenticação exigida pelo desafio como uma **Lambda própria** (`oficina-lambda-auth`) que valida o CPF, consulta o cliente no banco e assina um JWT — em vez de usar Amazon Cognito.

## Contexto

O requisito do PDF é específico: "Validar o CPF do cliente; Consultar a existência e o status do cliente na base de dados; Gerar e devolver um token (JWT) válido". Não é um login usuário/senha — é uma consulta de identidade contra dados de negócio já existentes (`customers`, com `CustomerDocument` validando CPF/CNPJ e o use case `find-customer-by-document`).

O módulo de aula "Desenvolvimento Serverless" ensina o par Lambda + API Gateway + **Cognito** para emissão/validação de JWT (Aulas 5-6), mas nesse contexto do curso o Cognito atua como *identity provider* completo (user pool, senha, MFA) — um modelo diferente do que o desafio pede aqui.

## Alternativas consideradas

### A — Amazon Cognito (User Pools)
Prós: é o padrão mostrado em aula para emissão de JWT validado nativamente pelo API Gateway (authorizer tipo JWT, sem Lambda extra na verificação).
Contras: Cognito é desenhado para autenticar *usuários com credenciais* (senha, MFA, federação). Autenticar "por CPF" contra uma tabela de clientes que já existe no domínio da aplicação exigiria replicar/sincronizar esses clientes como usuários do Cognito (ou usar Custom Authentication Flow, que adiciona 3 Lambda triggers só para emular uma checagem que já é uma simples consulta ao banco). Complexidade desproporcional ao requisito.
Descartada — resolve um problema (login com credenciais) diferente do que o desafio pede (lookup de identidade existente).

### B — Lambda própria + JWT assinado com `jsonwebtoken`, validado por Lambda Authorizer no API Gateway
Prós: mapeia 1:1 com o texto do requisito (validar CPF → consultar cliente → gerar JWT); reaproveita a lógica de domínio já validada na Fase 2 (`CustomerDocument`, `find-customer-by-document`); simples de testar localmente (é só uma function Node/TS, sem depender de infraestrutura de identidade adicional).
Contras: API Gateway não valida esse JWT nativamente (o authorizer tipo "JWT" do HTTP API só aceita tokens de um issuer com JWKS, como Cognito/Auth0) — é necessário um **Lambda Authorizer** (tipo REQUEST) que verifica a assinatura HS256 do token nas rotas protegidas. Isso é uma Lambda a mais, mas reaproveita o mesmo segredo/lib de verificação.

## Decisão

Alternativa B. Uma Lambda de emissão (`POST /auth/login`, recebe CPF, valida formato, consulta `customers`, assina JWT HS256 com segredo em AWS Secrets Manager) e um Lambda Authorizer que verifica esse mesmo JWT nas rotas protegidas do API Gateway (ver `docs/adr/0004-api-gateway-roteamento.md`). O guard atual da aplicação (`jwt-auth.guard.ts`) passa a validar o mesmo segredo/claims, como segunda camada (defesa em profundidade), em vez do JWT admin genérico usado hoje.

## Consequências

- Reaproveita diretamente o domínio já testado da Fase 2, reduzindo retrabalho e risco de regressão na regra de validação de CPF.
- Adiciona uma peça de infraestrutura (Lambda Authorizer) que não existiria se o Cognito fosse usado — trade-off aceito em troca de não forçar um modelo de identidade que não é o do domínio da oficina.
- O segredo de assinatura do JWT precisa estar acessível tanto pela Lambda de auth quanto pelo Authorizer quanto pela aplicação NestJS — via AWS Secrets Manager (ou SSM Parameter Store, mais barato/Free Tier) como fonte única, evitando segredo duplicado em cada repositório.
