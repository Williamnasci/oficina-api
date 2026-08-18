import { ConfigService } from '@nestjs/config';
import { ServiceOrderStatus } from '../../../../../../src/modules/service-orders/domain/enums/service-order-status.enum';
import { WebhookStatusNotificationGateway } from '../../../../../../src/modules/service-orders/infrastructure/notifications/webhook-status-notification.gateway';

describe('WebhookStatusNotificationGateway', () => {
  const event = {
    serviceOrderId: 'order-1',
    status: ServiceOrderStatus.FINISHED,
    occurredAt: '2026-07-03T12:00:00.000Z',
    createdAt: '2026-07-03T10:00:00.000Z',
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should skip delivery when the webhook is not configured', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    const configService = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;
    const metricsService = { recordIntegrationError: jest.fn() } as any;
    const gateway = new WebhookStatusNotificationGateway(configService, metricsService);

    await gateway.notifyStatusChanged(event);

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('should send the status event to the configured webhook', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);
    const configService = {
      get: jest.fn().mockReturnValue('https://example.test/status'),
    } as unknown as ConfigService;
    const metricsService = { recordIntegrationError: jest.fn() } as any;
    const gateway = new WebhookStatusNotificationGateway(configService, metricsService);

    await gateway.notifyStatusChanged(event);

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://example.test/status',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(event),
      }),
    );
    expect(metricsService.recordIntegrationError).not.toHaveBeenCalled();
  });

  it('should not fail the business flow when delivery fails', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockRejectedValue(new Error('network unavailable'));
    const configService = {
      get: jest.fn().mockReturnValue('https://example.test/status'),
    } as unknown as ConfigService;
    const metricsService = { recordIntegrationError: jest.fn() } as any;
    const gateway = new WebhookStatusNotificationGateway(configService, metricsService);

    await expect(gateway.notifyStatusChanged(event)).resolves.toBeUndefined();
    expect(metricsService.recordIntegrationError).toHaveBeenCalledWith('status_notification_webhook');
  });
});
