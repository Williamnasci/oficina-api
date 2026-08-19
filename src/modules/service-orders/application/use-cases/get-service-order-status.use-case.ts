import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../../auth/jwt.strategy';
import { ServiceOrderStatus } from '../../domain/enums/service-order-status.enum';
import { ServiceOrderRepository } from '../../domain/repositories/service-order.repository';
import { ServiceOrderStatusResponseDto } from '../dto/service-order-status-response.dto';

const STATUS_LABELS: Record<ServiceOrderStatus, string> = {
  [ServiceOrderStatus.RECEIVED]: 'Recebida',
  [ServiceOrderStatus.IN_DIAGNOSIS]: 'Diagnostico',
  [ServiceOrderStatus.WAITING_APPROVAL]: 'Aguardando Aprovacao',
  [ServiceOrderStatus.APPROVED]: 'Aprovada',
  [ServiceOrderStatus.IN_PROGRESS]: 'Execucao',
  [ServiceOrderStatus.FINISHED]: 'Finalizada',
  [ServiceOrderStatus.DELIVERED]: 'Entregue',
};

@Injectable()
export class GetServiceOrderStatusUseCase {
  constructor(
    @Inject(ServiceOrderRepository)
    private readonly serviceOrderRepository: ServiceOrderRepository,
  ) {}

  async execute(
    serviceOrderId: string,
    requestingUser: AuthenticatedUser,
  ): Promise<ServiceOrderStatusResponseDto> {
    const serviceOrder =
      await this.serviceOrderRepository.findById(serviceOrderId);

    if (!serviceOrder) {
      throw new NotFoundException('Service order not found.');
    }

    // Admin (back-office) consulta qualquer OS. Cliente (JWT emitido pela
    // Lambda, sub = customer.id, sem role) so pode consultar a propria -
    // sem isso, qualquer cliente autenticado com o UUID de outra OS
    // conseguia ver o status de um pedido que nao e dele.
    const isAdmin = requestingUser.role === 'admin';
    const isOwner = String(requestingUser.userId) === serviceOrder.customerId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException(
        'You do not have permission to view this service order.',
      );
    }

    return {
      id: serviceOrder.id,
      status: serviceOrder.status,
      statusLabel: STATUS_LABELS[serviceOrder.status],
      updatedAt: serviceOrder.updatedAt,
    };
  }
}
