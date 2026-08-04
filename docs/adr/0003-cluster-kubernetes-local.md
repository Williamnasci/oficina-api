# ADR-0003: Cluster Kubernetes local (Kind) em vez de EKS gerenciado

**Status:** Aceita
**Data:** 2026-08-03

## Contexto

O desafio pede "Cluster Kubernetes com escalabilidade" como parte da infraestrutura obrigatória, com Terraform para provisionamento, em nuvem de livre escolha (ver [[0001-escolha-da-nuvem]], que já fixou AWS).

Amazon EKS (o serviço gerenciado de Kubernetes da AWS) **não é coberto pelo Free Tier**: o control plane sozinho custa ~US$0,10/hora (~US$73/mês), cobrado mesmo sem nenhum worker node rodando, e mesmo sem tráfego algum. Diferente de Lambda, API Gateway (HTTP API) e RDS `db.t3.micro`, que têm free tier generoso o suficiente para o volume do desafio.

Como a conta usada é pessoal (ver RFC-0001), sem crédito institucional cobrindo excedentes (diferente de um cenário com AWS Academy), esse custo seria pago do próprio bolso, inclusive fora das janelas de uso caso o cluster seja esquecido ligado.

## Alternativas consideradas

### A — Amazon EKS permanente
Descartada: custo fixo mensal desnecessário para o escopo de um projeto acadêmico avaliado por demonstração pontual (vídeo de até 15 min), não por operação contínua.

### B — Amazon EKS ligado só durante gravação/demo, destruído depois
Atende ao requisito de forma mais literal ("cluster gerenciado na nuvem"), mas depende de disciplina operacional (lembrar de rodar `terraform destroy` sempre) e ainda assim gera custo pontual real. Risco de esquecimento gerar cobrança inesperada.

### C — Kubernetes self-managed via `kubeadm` em EC2 Free Tier (`t2.micro`/`t3.micro`)
Sem custo de licenciamento do control plane gerenciado, mas uma instância `t2.micro`/`t3.micro` (1 vCPU, 1GB RAM) é insuficiente para rodar control plane + aplicação + qualquer sidecar de observabilidade de forma estável — risco real de instabilidade durante a demonstração ao vivo exigida no vídeo.

### D — Manter Kind local (já usado na Fase 2)
Prós: zero custo, já validado e funcional desde a Fase 2, HPA já configurado (ver [[0002-uso-de-hpa]]), estabilidade total para a demonstração em vídeo (não depende de rede/latência de nuvem para o cluster em si).
Contras: não é "cluster gerenciado na nuvem" no sentido literal — decisão deliberada de interpretar o requisito como "Kubernetes com escalabilidade demonstrável", que o enunciado não amarra explicitamente a um serviço gerenciado específico.

## Decisão

Alternativa D — manter Kind, **mas hospedado numa instância EC2 Free Tier (`t3.micro`) com IP público**, não no notebook do desenvolvedor. O Terraform de infraestrutura (`oficina-infra-k8s`) fica restrito a provisionar os recursos AWS que de fato precisam ser gerenciados/serverless pelo enunciado (API Gateway, Lambda, RDS), mais essa EC2 que hospeda o Kind.

### Correção em relação à primeira versão desta decisão

A primeira versão desta ADR assumia Kind rodando localmente no notebook, mas isso quebra o diagrama de componentes: o API Gateway (na AWS) precisa de um alvo de integração alcançável pela rede para rotear as requisições até a aplicação (ver `docs/architecture-components.md`), e um cluster só no notebook do desenvolvedor não é publicamente alcançável (fica atrás de NAT/firewall doméstico). Duas soluções possíveis:

- **EC2 Free Tier com Kind** (escolhida): sobe uma instância `t3.micro` (Free Tier, 750h/mês), instala Docker + Kind nela, expõe a porta do serviço NestJS (via `NodePort` ou um `LoadBalancer` local tipo `cloud-provider-kind`) no IP público da instância. O API Gateway usa uma integração HTTP privada/pública apontando para esse IP:porta. Kind continua sendo "não gerenciado" (não é EKS, sem custo de control plane) e mesmo assim fica de fato na nuvem e alcançável.
- **Tunnel a partir do notebook** (ngrok/Cloudflare Tunnel): mais rápido de configurar, mas gera uma URL que muda a cada sessão (a menos que se pague por domínio fixo) e depende do notebook estar ligado durante toda avaliação — inadequado para links de deploy "ativos" permanentes exigidos no PDF.

A EC2 `t3.micro` é suficiente aqui porque o Kind (Kubernetes-in-Docker, cluster single-node em containers) é muito mais leve que um cluster `kubeadm` completo — diferente da alternativa C original (descartada por instabilidade), aqui não estamos rodando `kubeadm` multi-componente do zero, só os containers do Kind + os pods da aplicação.

## Consequências

### Positivas
- Elimina o maior risco de custo real do projeto.
- Preserva a base estável já validada na Fase 2 para o dia da gravação do vídeo.

### Negativas / trade-offs aceitos
- Diverge da leitura mais literal de "cluster Kubernetes" totalmente cloud-native — precisa estar explicitamente justificado na documentação de entrega (este ADR) para não parecer omissão não intencional.
- Se o avaliador exigir estritamente um cluster gerenciado na nuvem, a alternativa B (EKS temporário, ligado só na demo) fica documentada como plano de contingência.
