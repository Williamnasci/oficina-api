# ADR-0001: Padrão de comunicação — REST síncrono, sem barramento de eventos

**Status:** Aceita
**Data:** 2026-08-03

## Contexto

A Fase 2 já implementa a aplicação principal como um monolito modular NestJS expondo REST/HTTP, com Clean Architecture por módulo. A Fase 3 adiciona uma Lambda de autenticação e um API Gateway na frente de tudo.

O enunciado menciona, como desejo do negócio (não como requisito obrigatório detalhado), "adotar soluções serverless para autenticação **e notificações**". Só o item de autenticação aparece detalhado na seção "Requisitos obrigatórios" do PDF — não há uma function de notificação especificada com contrato definido.

## Decisão

Manter comunicação **síncrona via REST/HTTP** em todos os fluxos novos: API Gateway → Lambda de auth (request/response), API Gateway → aplicação principal (proxy). Não introduzir um barramento de eventos (SQS/SNS/EventBridge) nesta fase.

Uma eventual function de notificação (mencionada como desejo, não como requisito obrigatório) fica fora do escopo mínimo; se houver tempo após os requisitos obrigatórios estarem completos, ela pode ser adicionada como acionamento assíncrono (ex: EventBridge disparado por mudança de status de OS) sem impacto nas decisões já tomadas, por ser um componente aditivo e desacoplado.

## Consequências

### Positivas
- Menor superfície de infraestrutura nova: sem fila, sem tópico, sem DLQ para operar/monitorar/documentar sob prazo.
- Mantém consistência com o estilo arquitetural já estabelecido na Fase 2 (REST síncrono), reduzindo risco de regressão.
- Mais simples de demonstrar no vídeo (request → response direto, sem latência de processamento assíncrono para explicar).

### Negativas / trade-offs aceitos
- Não implementa o desejo de "notificações serverless" citado no enunciado como meta de negócio — decisão consciente de priorizar os requisitos obrigatórios explícitos.
- Se a oficina realmente crescer (motivação de negócio citada no desafio), acoplamento síncrono entre Gateway e aplicação principal não escala tão bem quanto um modelo orientado a eventos — aceito como limitação de escopo acadêmico, não como recomendação para produção real.
