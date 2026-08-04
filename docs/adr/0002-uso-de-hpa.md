# ADR-0002: Uso de HPA (Horizontal Pod Autoscaler)

**Status:** Aceita
**Data:** 2026-08-03

## Contexto

O desafio exige "Cluster Kubernetes com escalabilidade". A Fase 2 já configura HPA para o Deployment da aplicação principal. A decisão de manter o cluster local via Kind (ver [[0003-cluster-kubernetes-local]]) significa que a escalabilidade demonstrável nesta fase é a nível de pods dentro do cluster local, não de nós elásticos de um cluster gerenciado.

## Decisão

Manter e validar o HPA baseado em utilização de CPU (e, se necessário para tornar o comportamento mais visível em carga leve de teste, memória) como mecanismo de escalabilidade horizontal da aplicação principal, com `minReplicas`/`maxReplicas` ajustados ao ambiente Kind local usado nas demonstrações.

## Consequências

### Positivas
- Cobre literalmente o requisito de "escalabilidade" do cluster sem depender de infraestrutura de nós gerenciada (que teria custo, ver ADR-0003).
- Reaproveita configuração já validada na Fase 2, sem trabalho novo de infraestrutura — só validação/ajuste dos limites de réplica para o cenário de demo.
- Fácil de demonstrar no vídeo: gerar carga (ex: `hey`/`ab`) e mostrar o número de pods subindo em tempo real via `kubectl get hpa -w`.

### Negativas / trade-offs aceitos
- Em Kind local não há autoscaling de nós (Cluster Autoscaler) — a escalabilidade fica limitada à capacidade de CPU/memória da máquina host rodando o Kind. Documentado como limitação assumida, coerente com a decisão de custo do ADR-0003.
