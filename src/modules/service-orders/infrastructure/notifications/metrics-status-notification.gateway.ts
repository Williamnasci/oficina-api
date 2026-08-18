import { Injectable } from '@nestjs/common';
import { MetricsService } from '../../../../observability/metrics.service';
import {
  ServiceOrderStatusChanged,
  StatusNotificationGateway,
} from '../../application/ports/status-notification.gateway';
import { WebhookStatusNotificationGateway } from './webhook-status-notification.gateway';

// Decora o gateway de webhook para tambem alimentar a metrica de negocio
// "tempo ate atingir cada status" (dashboard exigido no PDF), sem espalhar
// chamadas de metricas pelos 6 use-cases de transicao de status - todos ja
// chamam notifyStatusChanged de forma uniforme.
@Injectable()
export class MetricsStatusNotificationGateway extends StatusNotificationGateway {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly webhookGateway: WebhookStatusNotificationGateway,
  ) {
    super();
  }

  async notifyStatusChanged(event: ServiceOrderStatusChanged): Promise<void> {
    const durationSeconds =
      (new Date(event.occurredAt).getTime() - new Date(event.createdAt).getTime()) / 1000;

    this.metricsService.recordTimeToStatus(event.status, Math.max(durationSeconds, 0));

    await this.webhookGateway.notifyStatusChanged(event);
  }
}
