import { ApiProperty } from '@nestjs/swagger';

export class ServiceOrderMetricsResponseDto {
  @ApiProperty({
    description:
      'Average execution time in minutes for finished service orders',
    example: 180,
  })
  averageExecutionTimeInMinutes: number;

  @ApiProperty({
    description: 'Average execution time formatted for display',
    example: '3h 0m',
  })
  averageExecutionTimeFormatted: string;
}
