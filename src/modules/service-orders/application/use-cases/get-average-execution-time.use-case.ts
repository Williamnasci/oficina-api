import { Inject, Injectable } from '@nestjs/common';
import { ServiceOrderRepository } from '../../domain/repositories/service-order.repository';
import { ServiceOrderMetricsResponseDto } from '../dto/service-order-metrics-response.dto';

@Injectable()
export class GetAverageExecutionTimeUseCase {
  constructor(
    @Inject(ServiceOrderRepository)
    private readonly serviceOrderRepository: ServiceOrderRepository,
  ) {}

  async execute(): Promise<ServiceOrderMetricsResponseDto> {
    const averageExecutionTimeInMinutes =
      await this.serviceOrderRepository.getAverageExecutionTimeInMinutes();

    return {
      averageExecutionTimeInMinutes,
      averageExecutionTimeFormatted: this.formatMinutes(
        averageExecutionTimeInMinutes,
      ),
    };
  }

  private formatMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return `${hours}h ${remainingMinutes}m`;
  }
}
