import { ListOperationalServiceOrdersUseCase } from '../../../../../../src/modules/service-orders/application/use-cases/list-operational-service-orders.use-case';
import { ServiceOrder } from '../../../../../../src/modules/service-orders/domain/entities/service-order.entity';
import { ServiceOrderStatus } from '../../../../../../src/modules/service-orders/domain/enums/service-order-status.enum';
import { ServiceOrderRepository } from '../../../../../../src/modules/service-orders/domain/repositories/service-order.repository';

describe('ListOperationalServiceOrdersUseCase', () => {
    it('should return mapped operational service orders', async () => {
        // Double minimo (so o metodo usado pelo caso de uso) - o cast
        // explicito documenta que e um double parcial de proposito, em vez
        // de deixar o compilador reclamar de propriedades faltando.
        const repo = {
            findOperationalQueue: jest.fn().mockResolvedValue([
                new ServiceOrder({
                    id: '1',
                    customerId: 'c-1',
                    vehicleId: 'v-1',
                    status: ServiceOrderStatus.IN_PROGRESS,
                }),
            ]),
        } as unknown as ServiceOrderRepository;
        const useCase = new ListOperationalServiceOrdersUseCase(repo);

        const result = await useCase.execute();

        expect(repo.findOperationalQueue).toHaveBeenCalled();
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
            id: '1',
            customerId: 'c-1',
            vehicleId: 'v-1',
            status: ServiceOrderStatus.IN_PROGRESS,
        });
    });
});
