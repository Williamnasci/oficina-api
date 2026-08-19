# ADR-0007: Migração da conta pessoal Free Tier para AWS Academy Learner Lab

**Status:** Aceita
**Data:** 2026-08-19

## Contexto

O [RFC-0001](../rfc/0001-escolha-da-nuvem.md) decidiu usar uma conta pessoal Free Tier
porque, no início do planejamento, não havia acesso a uma conta AWS Academy Learner
Lab (a opção originalmente cogitada, por ser a que a FIAP normalmente disponibiliza).

Esse acesso passou a existir em 2026-08-19. Nesse mesmo dia, migramos toda a
infraestrutura (`oficina-infra-k8s`, `oficina-infra-database`, `oficina-lambda-auth`)
da conta pessoal para a conta do Learner Lab, e a conta pessoal foi encerrada
(`Close Account` no console de billing).

## Decisão

Usar a conta **AWS Academy Learner Lab**, região `us-east-1`, como provedor de nuvem
para o restante do projeto — substituindo a decisão do RFC-0001, que fica preservado
como registro histórico (não editado) e agora **superado** por este ADR.

## Consequências reais, diferentes de uma conta normal

- **Orçamento fixo de USD 50 para todo o curso** (não é mensal) — cada recurso deixado
  rodando entre sessões consome esse teto, não um limite recorrente.
- **Credenciais temporárias por sessão** (access key + secret key + session token, via
  `Start Lab` → `AWS Details` → `Show`), expirando junto com a sessão do lab (~4h,
  renovável). Sem isso, `terraform apply`/`aws cli` local ou em CI simplesmente param
  de autenticar.
- **`LabRole` nega gestão de IAM** (`iam:CreateUser`, `iam:CreateRole`,
  `iam:PutRolePolicy`) — não é possível criar usuário ou role IAM escopada própria.
  EC2 e as duas Lambdas passaram a reusar `LabInstanceProfile`/`LabRole`,
  pré-provisionados pela própria plataforma (ver comentários em
  `oficina-infra-k8s/iam.tf` e `oficina-lambda-auth/terraform/main.tf`).
- **Sem credencial permanente, o `apply` dos 3 repositórios que tocam AWS deixou de
  rodar automático no merge** — virou `workflow_dispatch` manual, disparado depois de
  atualizar os secrets `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`/`AWS_SESSION_TOKEN`
  com uma sessão fresca do lab.
- **A EC2 é frequentemente parada/reiniciada pela própria plataforma do lab entre
  sessões** (não necessariamente terminada — observado sobrevivendo a um stop/start
  real), o que muda o IP público (sem Elastic IP, decisão consciente de custo) e pode
  deixar o Docker/kind num estado degradado exigindo recriação da instância.
- **Acesso ao lab termina quando o curso termina** — é um prazo real de entrega, não
  só uma preferência de custo.

## Alternativas consideradas

Manter a conta pessoal Free Tier: rejeitada porque o acesso ao Academy passou a
existir e é o ambiente que a FIAP de fato disponibiliza — não faz sentido manter uma
conta pessoal pagando por algo que a instituição já cobre via sandbox acadêmico.

## Referências

- [RFC-0001](../rfc/0001-escolha-da-nuvem.md) — decisão original, superada por este ADR.
- `CLAUDE.md` (raiz do repositório) — orientação operacional detalhada para a IA
  trabalhar dentro dessas restrições.
