import { DomainException } from '../../../../shared/domain/errors/domain.exception';
import { ServiceOrderStatus } from '../enums/service-order-status.enum';

export type ServiceOrderProps = {
  id: string;
  customerId: string;
  vehicleId: string;
  status?: ServiceOrderStatus;
  diagnosis?: string | null;
  servicesAmount?: number;
  stockItemsAmount?: number;
  totalAmount?: number;
  createdAt?: Date;
  startedAt?: Date | null;
  finishedAt?: Date | null;
  deliveredAt?: Date | null;
  updatedAt?: Date;
};

export class ServiceOrder {
  public readonly id: string;
  public readonly customerId: string;
  public readonly vehicleId: string;
  public status: ServiceOrderStatus;
  public diagnosis: string | null;
  public servicesAmount: number;
  public stockItemsAmount: number;
  public totalAmount: number;
  public readonly createdAt: Date;
  public startedAt: Date | null;
  public finishedAt: Date | null;
  public deliveredAt: Date | null;
  public updatedAt: Date;

  constructor(props: ServiceOrderProps) {
    this.id = props.id;
    this.customerId = props.customerId;
    this.vehicleId = props.vehicleId;
    this.status = props.status ?? ServiceOrderStatus.RECEIVED;
    this.diagnosis = props.diagnosis ?? null;
    this.servicesAmount = props.servicesAmount ?? 0;
    this.stockItemsAmount = props.stockItemsAmount ?? 0;
    this.totalAmount = props.totalAmount ?? 0;
    this.createdAt = props.createdAt ?? new Date();
    this.startedAt = props.startedAt ?? null;
    this.finishedAt = props.finishedAt ?? null;
    this.deliveredAt = props.deliveredAt ?? null;
    this.updatedAt = props.updatedAt ?? new Date();
  }

  public registerDiagnosis(diagnosis: string): void {
    if (!diagnosis?.trim()) {
      throw new DomainException('Diagnosis is required.');
    }

    // Sem essa checagem, uma OS ja FINISHED/DELIVERED podia voltar para
    // IN_DIAGNOSIS a qualquer momento - este metodo nao validava o
    // estado atual, so o conteudo do diagnostico.
    if (
      this.status !== ServiceOrderStatus.RECEIVED &&
      this.status !== ServiceOrderStatus.IN_DIAGNOSIS
    ) {
      throw new DomainException(
        'Diagnosis can only be registered while the order is received or in diagnosis.',
      );
    }

    this.diagnosis = diagnosis.trim();
    this.status = ServiceOrderStatus.IN_DIAGNOSIS;
    this.touch();
  }

  public sendBudgetForApproval(): void {
    if (!this.diagnosis) {
      throw new DomainException(
        'Diagnosis must be registered before sending budget.',
      );
    }

    // `diagnosis` permanece preenchido para sempre depois do primeiro
    // registro - checar so isso permitia reenviar orcamento (voltando
    // para WAITING_APPROVAL) de qualquer estado posterior, inclusive
    // FINISHED/DELIVERED.
    if (this.status !== ServiceOrderStatus.IN_DIAGNOSIS) {
      throw new DomainException(
        'Only service orders in diagnosis can have a budget sent for approval.',
      );
    }

    this.status = ServiceOrderStatus.WAITING_APPROVAL;
    this.touch();
  }

  public approveBudget(): void {
    if (this.status !== ServiceOrderStatus.WAITING_APPROVAL) {
      throw new DomainException(
        'Only service orders waiting approval can be approved.',
      );
    }

    this.status = ServiceOrderStatus.APPROVED;
    this.touch();
  }

  public rejectBudget(): void {
    if (this.status !== ServiceOrderStatus.WAITING_APPROVAL) {
      throw new DomainException(
        'Only service orders waiting approval can be rejected.',
      );
    }

    this.status = ServiceOrderStatus.IN_DIAGNOSIS;
    this.touch();
  }

  public startExecution(): void {
    if (this.status === ServiceOrderStatus.IN_PROGRESS) {
      return;
    }

    if (this.status !== ServiceOrderStatus.APPROVED) {
      throw new DomainException(
        'Service order must be approved before starting execution.',
      );
    }

    this.status = ServiceOrderStatus.IN_PROGRESS;
    this.startedAt = new Date();
    this.touch();
  }

  public finish(): void {
    if (this.status !== ServiceOrderStatus.IN_PROGRESS) {
      throw new DomainException(
        'Only service orders in progress can be finished.',
      );
    }

    this.status = ServiceOrderStatus.FINISHED;
    this.finishedAt = new Date();
    this.touch();
  }

  public deliver(): void {
    if (this.status !== ServiceOrderStatus.FINISHED) {
      throw new DomainException(
        'Only finished service orders can be delivered.',
      );
    }

    this.status = ServiceOrderStatus.DELIVERED;
    this.deliveredAt = new Date();
    this.touch();
  }

  public updateServicesAmount(amount: number): void {
    this.servicesAmount = amount;
    this.recalculateTotal();
    this.touch();
  }

  public updateStockItemsAmount(amount: number): void {
    this.stockItemsAmount = amount;
    this.recalculateTotal();
    this.touch();
  }

  public recalculateTotal(): void {
    this.totalAmount = this.servicesAmount + this.stockItemsAmount;
  }

  private touch(): void {
    this.updatedAt = new Date();
  }
}
