# ADR-0006: Acesso de rede ao RDS a partir de componentes fora da VPC

**Status:** Aceita
**Data:** 2026-08-03

## Contexto

A Lambda de autenticação (`oficina-lambda-auth`) precisa consultar a tabela `Customer` no RDS PostgreSQL (`oficina-infra-database`) a cada login. Por padrão, uma função Lambda roda **fora** de qualquer VPC, com acesso irrestrito à internet (necessário, por exemplo, para resolver o segredo no Secrets Manager). Colocar a Lambda **dentro** da VPC do RDS (para usar o security group como controle de acesso) exigiria também acesso à internet de dentro da VPC — o que implica um **NAT Gateway** (~US$0,045/hora + tráfego, não é Free Tier) ou VPC Interface Endpoints para Secrets Manager (também não gratuitos). Qualquer uma das duas opções reintroduz o mesmo problema de custo já resolvido no [ADR-0003](0003-cluster-kubernetes-local.md) para o cluster Kubernetes.

## Alternativas consideradas

### A — Lambda dentro da VPC + NAT Gateway
Solução "por livro" (rede totalmente privada), mas com custo mensal fixo incompatível com a restrição de Free Tier do projeto (RFC-0001).

### B — Lambda dentro da VPC + VPC Interface Endpoint para Secrets Manager
Evita o NAT Gateway, mas o endpoint por si só também tem custo por hora — mesma objeção de custo.

### C — RDS publicamente acessível, security group restrito por CIDR explícito
`publicly_accessible = true`, mas o security group nega tudo por padrão (`allowed_cidr_blocks` vazio) e só libera IPs adicionados explicitamente (o IP da EC2 do cluster — ver [ADR-0003](0003-cluster-kubernetes-local.md) — e, opcionalmente, o IP de quem roda migrations localmente). O problema remanescente: **o IP de saída da Lambda (fora de VPC) não é fixo/previsível**, então não dá para restringi-lo por CIDR da mesma forma.

## Decisão

Alternativa C, com uma exceção explícita e documentada: o security group do RDS libera por CIDR a EC2 do cluster e IPs de desenvolvimento conhecidos: para a Lambda, que não tem IP fixo, a mitigação é **autenticação forte** (senha aleatória de 32 caracteres gerada pelo Terraform, armazenada no Secrets Manager, nunca em código) **e TLS obrigatório** (`rds.force_ssl = 1` via parameter group, aplicado em `oficina-infra-database/main.tf`) — não isolamento de rede. Este é um trade-off consciente de custo vs. defesa em profundidade, aceito para o escopo do desafio.

## Consequências

### Positivas
- Zero custo de NAT Gateway/VPC endpoints, mantendo a conta dentro do Free Tier.
- Credenciais nunca aparecem em código-fonte ou logs — apenas no Secrets Manager, resolvidas em runtime.

### Negativas / trade-offs aceitos
- O endpoint do RDS é alcançável pela internet; a segurança depende inteiramente de credencial forte + TLS, não de isolamento de rede. Para uma carga de trabalho real de produção (fora do escopo acadêmico deste desafio), a recomendação correta seria a Alternativa A ou B.
- Se o IP de saída da Lambda for descoberto e a senha vazar, não há uma segunda barreira de rede. Mitigação parcial: rotação do segredo no Secrets Manager é simples (basta `terraform apply` com um novo `random_password`), caso necessário.

## Atualização (aplicação real)

A regra final em `oficina-infra-database/main.tf` (`postgres_open_for_lambda_auth`) libera `0.0.0.0/0` na porta 5432 — não um CIDR específico da Lambda, porque esse CIDR nunca existiu (o próprio texto acima já explicava por quê). O nome do recurso e a descrição no Terraform foram ajustados para dizer isso explicitamente ("ABERTO GLOBALMENTE"), evitando a impressão de que é uma regra restrita.

TLS deixou de ser só criptografia: `oficina-api` e `oficina-lambda-auth` agora validam a identidade do servidor de verdade, usando o bundle oficial de CA da AWS (`rds-ca-bundle.ts`, baixado de `https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem`) com `rejectUnauthorized: true`, em vez de `rejectUnauthorized: false`. Isso fecha a lacuna de um ataque man-in-the-middle na rede pública entre a Lambda e o RDS — a mitigação "TLS obrigatório" citada acima agora é literal, não só nominal.
