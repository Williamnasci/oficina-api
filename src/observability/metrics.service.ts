import { Injectable } from '@nestjs/common';
import {
  collectDefaultMetrics,
  Counter,
  Gauge,
  Histogram,
  Registry,
} from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly registry = new Registry();
  private readonly requestsTotal: Counter<string>;
  private readonly requestDuration: Histogram<string>;
  private readonly healthcheckStatus: Gauge<string>;
  private readonly serviceOrdersCreatedTotal: Counter<string>;
  private readonly serviceOrderTimeToStatusSeconds: Histogram<string>;
  private readonly integrationErrorsTotal: Counter<string>;

  constructor() {
    collectDefaultMetrics({
      register: this.registry,
      prefix: 'oficina_',
    });

    this.requestsTotal = new Counter({
      name: 'requests_total',
      help: 'Total de requisicoes HTTP recebidas pela API.',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    this.requestDuration = new Histogram({
      name: 'request_duration_seconds',
      help: 'Duracao das requisicoes HTTP em segundos.',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
      registers: [this.registry],
    });

    this.healthcheckStatus = new Gauge({
      name: 'healthcheck_status',
      help: 'Status do health check da API. 1 para saudavel, 0 para erro.',
      labelNames: ['component'],
      registers: [this.registry],
    });

    this.serviceOrdersCreatedTotal = new Counter({
      name: 'service_orders_created_total',
      help: 'Total de ordens de servico abertas.',
      registers: [this.registry],
    });

    this.serviceOrderTimeToStatusSeconds = new Histogram({
      name: 'service_order_time_to_status_seconds',
      help: 'Tempo decorrido desde a abertura da OS ate ela atingir cada status.',
      labelNames: ['status'],
      buckets: [60, 300, 900, 1800, 3600, 14400, 43200, 86400, 259200],
      registers: [this.registry],
    });

    this.integrationErrorsTotal = new Counter({
      name: 'integration_errors_total',
      help: 'Total de erros em integracoes externas (ex: webhook de notificacao de status).',
      labelNames: ['target'],
      registers: [this.registry],
    });
  }

  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    durationSeconds: number,
  ): void {
    const labels = {
      method,
      route,
      status_code: String(statusCode),
    };

    this.requestsTotal.inc(labels);
    this.requestDuration.observe(labels, durationSeconds);
  }

  setHealthcheckStatus(component: 'app' | 'database', healthy: boolean): void {
    this.healthcheckStatus.set({ component }, healthy ? 1 : 0);
  }

  recordServiceOrderCreated(): void {
    this.serviceOrdersCreatedTotal.inc();
  }

  recordTimeToStatus(status: string, durationSeconds: number): void {
    this.serviceOrderTimeToStatusSeconds.observe({ status }, durationSeconds);
  }

  recordIntegrationError(target: string): void {
    this.integrationErrorsTotal.inc({ target });
  }

  getContentType(): string {
    return this.registry.contentType;
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}
