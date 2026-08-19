import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum BudgetDecision {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class BudgetDecisionDto {
  @ApiProperty({ enum: BudgetDecision, example: BudgetDecision.APPROVED })
  @IsEnum(BudgetDecision)
  decision!: BudgetDecision;
}
