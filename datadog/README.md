# Configuração do Datadog (dashboard e monitors)

Definições versionadas do dashboard e dos monitors criados via API do Datadog (`us5.datadoghq.com`). Não são aplicadas automaticamente pelo CI/CD — o Datadog Agent (instalado via Helm no deploy) é o único componente provisionado automaticamente; dashboard e monitors são recursos de conta, criados uma vez e atualizados manualmente quando o layout ou os thresholds mudam.

## Arquivos

- `dashboard.json` — [Oficina API - Visão Geral](https://us5.datadoghq.com/dashboard/k2b-3e2-bz4/oficina-api---visao-geral): volume de OS, tempo médio por status, erros de integração, latência média, healthcheck.
- `monitors/healthcheck.json` — alerta quando `healthcheck_status` fica abaixo de 1 por 5 minutos.
- `monitors/integration-errors.json` — alerta quando há mais de 5 erros de integração (webhook de notificação de status) em 15 minutos.

## Nomenclatura das métricas

Os widgets usam nomes de métrica no formato que o Datadog OpenMetrics/Prometheus scraper gera a partir do `/metrics` da aplicação — **não** os nomes originais do `prom-client`:

| No `prom-client` (app) | No Datadog |
|---|---|
| `service_orders_created_total` (Counter) | `service_orders_created.count` |
| `service_order_time_to_status_seconds` (Histogram) | `service_order_time_to_status_seconds.{count,sum,bucket}` |
| `integration_errors_total` (Counter) | `integration_errors.count` |
| `requests_total` (Counter) | `requests.count` |
| `request_duration_seconds` (Histogram) | `request_duration_seconds.{count,sum,bucket}` |

Contadores Prometheus terminados em `_total` perdem o sufixo e ganham `.count`; histogramas viram `.count`/`.sum`/`.bucket`. Médias são calculadas nas queries do dashboard como `sum / count` (não existe um `.avg` automático).

## Como aplicar (criar do zero ou atualizar)

Precisa de uma API key e uma Application key (`us5.datadoghq.com/organization-settings/api-keys` e `.../application-keys`). Nunca cole as chaves em texto — exporte como variável de ambiente na sua sessão local:

```bash
export DD_API_KEY="..."
export DD_APP_KEY="..."
```

**Criar o dashboard pela primeira vez:**
```bash
curl -s -X POST "https://api.us5.datadoghq.com/api/v1/dashboard" \
  -H "DD-API-KEY: $DD_API_KEY" -H "DD-APPLICATION-KEY: $DD_APP_KEY" \
  -H "Content-Type: application/json" -d @datadog/dashboard.json
```

**Atualizar o dashboard existente** (troque `<dashboard_id>` pelo id retornado na criação, ou pegue na URL do dashboard):
```bash
curl -s -X PUT "https://api.us5.datadoghq.com/api/v1/dashboard/<dashboard_id>" \
  -H "DD-API-KEY: $DD_API_KEY" -H "DD-APPLICATION-KEY: $DD_APP_KEY" \
  -H "Content-Type: application/json" -d @datadog/dashboard.json
```

**Criar um monitor:**
```bash
curl -s -X POST "https://api.us5.datadoghq.com/api/v1/monitor" \
  -H "DD-API-KEY: $DD_API_KEY" -H "DD-APPLICATION-KEY: $DD_APP_KEY" \
  -H "Content-Type: application/json" -d @datadog/monitors/healthcheck.json
```
