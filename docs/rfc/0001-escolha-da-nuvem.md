# RFC-0001: Escolha da nuvem

**Status:** Aceita
**Data:** 2026-08-03

## Resumo

Adotar **AWS**, usando uma conta pessoal Free Tier (região `us-east-2`, Ohio), como provedor de nuvem para todos os componentes gerenciados da Fase 3 (API Gateway, Function Serverless de autenticação, banco de dados gerenciado).

## Contexto

O desafio exige, em nuvem livre-escolha: API Gateway, Function Serverless de autenticação por CPF, banco de dados gerenciado e Terraform para provisionar tudo. A Fase 2 já usa Kubernetes local (Kind) e Terraform, sem depender de nenhuma nuvem específica.

Não havia, no início do planejamento, acesso a uma conta AWS Academy Learner Lab (a opção originalmente cogitada, por ser a conta normalmente disponibilizada pela FIAP).

## Alternativas consideradas

### A — AWS Academy Learner Lab
Prós: crédito institucional, zero custo real.
Contras: sem acesso ativo no momento do planejamento; mesmo quando disponível, tipicamente restringe criação/edição de IAM (usa `LabRole` fixa) e expira credenciais por sessão, o que complica pipelines de CI/CD que rodam `terraform apply` de forma não interativa.
Descartada por falta de acesso.

### B — Azure
Prós: "Azure for Students" tem free tier; o módulo de aula "API Gateway" do curso é majoritariamente Azure APIM.
Contras: o padrão específico exigido pelo desafio — function que valida CPF, consulta cliente e emite JWT, protegendo rota no gateway — só é ensinado no curso com **AWS Lambda + API Gateway** (módulo "Desenvolvimento Serverless", aulas 5-6). Não há Azure Functions em nenhuma aula do curso. Migrar essa parte para Azure significaria implementar sem nenhuma referência do material.
Descartada: o núcleo mais específico do desafio amarra a escolha à AWS.

### C — Local apenas (LocalStack, sem nuvem real)
Prós: zero custo, zero dependência externa.
Contras: o desafio pede "links para os deploys ativos" e um vídeo demonstrando "deploy automatizado" — uma solução 100% simulada localmente não atende ao espírito do requisito de operação em nuvem real.
Descartada.

### D — AWS, conta pessoal Free Tier
Prós: acesso imediato (conta criada), alinhada ao único material do curso que ensina o padrão de auth exigido, sem restrições de IAM ou expiração de sessão como a Academy.
Contras: sem crédito institucional — custo real vira uma restrição de projeto (ver [[0003-cluster-kubernetes-local]] sobre a decisão de não usar EKS por causa disso).

## Decisão

AWS, conta pessoal Free Tier, região `us-east-2` (Ohio) fixa em todos os módulos Terraform.

## Consequências

- Custo é uma restrição real a partir de agora; decisões subsequentes (ex: cluster Kubernetes) precisam considerar o que é coberto por Free Tier.
- Recursos que não são Free Tier "always free" (ex: RDS `db.t3.micro` tem 750h/mês grátis só nos primeiros 12 meses da conta) devem ser destruídos fora das janelas de uso/demo via `terraform destroy`.
- Região única simplifica troubleshooting e evita custo de tráfego entre regiões.
