# AWS Guidance

- Prefer the AWS MCP Server for AWS interactions — it provides sandboxed
  execution, observability, and audit logging. If unavailable, use the
  AWS CLI directly.
- Before starting a task, check whether a relevant AWS skill is available.
  Load the skill with `retrieve_skill` and prefer its guidance over
  general knowledge.
- When uncertain about specific AWS details (API parameters, permissions,
  limits, error codes), verify against documentation rather than guessing.
  State uncertainty explicitly if you cannot confirm.
- When creating infrastructure, prefer infrastructure-as-code (AWS CDK or
  CloudFormation) over direct CLI commands.
- When working with infrastructure, follow AWS Well-Architected Framework
  principles.
- Do not use em dashes in AWS resource names or descriptions. Use
  hyphens instead.

## Secret Safety

- MUST load the `aws-secrets-manager` skill first for any secret,
  credential, API key, token, or password task. MUST NOT call
  `secretsmanager get-secret-value` or `batch-get-secret-value`, and MUST
  NOT hit the Secrets Manager Agent daemon directly. MUST use
  `{{resolve:secretsmanager:secret-id:SecretString:json-key}}` with
  `asm-exec` so the secret resolves at runtime without entering context.

## Override for this project

- O enunciado do Tech Challenge (Fase 3) exige **Terraform** explicitamente
  ("Terraform para provisionamento") como requisito obrigatório avaliado.
  Isso tem prioridade sobre a preferência genérica por CDK/CloudFormation
  acima — use Terraform para toda a infraestrutura AWS deste repositório
  (Lambda, API Gateway, RDS), não CDK/CloudFormation.
- Conta AWS usada é uma sandbox do **AWS Academy Learner Lab** (migrada da
  conta pessoal Free Tier em 2026-08-19), região fixa `us-east-1`.
  Restrições reais e diferentes de uma conta normal: orçamento fixo de
  USD 50 para todo o curso (não é mensal), sessão de lab de ~4h renovável
  com credenciais **temporárias** (access key + secret key + session
  token, todas expiram junto), e o `LabRole` da conta **nega
  `iam:CreateUser`/gestão de IAM** — não é possível criar um usuário IAM
  permanente para CI/CD. Por causa disso, os workflows de `apply` dos 3
  repos que tocam AWS (`oficina-infra-k8s`, `oficina-infra-database`,
  `oficina-lambda-auth`) são disparados manualmente
  (`workflow_dispatch`), não automaticamente no merge — atualizar os 3
  secrets AWS com uma sessão fresca do lab antes de cada apply. A EC2 do
  cluster é terminada automaticamente pelo próprio Academy ao fim de cada
  sessão (não precisa mais destruir manualmente); o RDS não é, e continua
  consumindo o orçamento entre sessões. Ver
  `docs/rfc/0001-escolha-da-nuvem.md` e
  `docs/adr/0003-cluster-kubernetes-local.md` antes de provisionar
  qualquer recurso novo.
- Decisões arquiteturais desta fase estão documentadas em
  `docs/phase-3-plan.md`, `docs/rfc/` e `docs/adr/`. Consulte antes de
  propor uma alternativa já decidida e justificada ali.
