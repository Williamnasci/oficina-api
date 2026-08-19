import { ServiceOrder } from '../../../../../../src/modules/service-orders/domain/entities/service-order.entity';
import { ServiceOrderStatus } from '../../../../../../src/modules/service-orders/domain/enums/service-order-status.enum';
import { DomainException } from '../../../../../../src/shared/domain/errors/domain.exception';

describe('ServiceOrder Entity - Extended', () => {
    it('should approve budget when WAITING_APPROVAL', () => {
        const order = new ServiceOrder({
            id: '1', customerId: 'c-1', vehicleId: 'v-1',
            status: ServiceOrderStatus.WAITING_APPROVAL,
        });

        order.approveBudget();
        expect(order.status).toBe(ServiceOrderStatus.APPROVED);
        expect(order.startedAt).toBeNull();
    });

    it('should throw when approving budget not in WAITING_APPROVAL', () => {
        const order = new ServiceOrder({ id: '1', customerId: 'c-1', vehicleId: 'v-1' });
        expect(() => order.approveBudget()).toThrow(DomainException);
    });

    it('should reject budget and return to diagnosis when WAITING_APPROVAL', () => {
        const order = new ServiceOrder({
            id: '1', customerId: 'c-1', vehicleId: 'v-1',
            status: ServiceOrderStatus.WAITING_APPROVAL,
        });

        order.rejectBudget();

        expect(order.status).toBe(ServiceOrderStatus.IN_DIAGNOSIS);
    });

    it('should throw when rejecting budget not in WAITING_APPROVAL', () => {
        const order = new ServiceOrder({ id: '1', customerId: 'c-1', vehicleId: 'v-1' });

        expect(() => order.rejectBudget()).toThrow(DomainException);
    });

    it('should register diagnosis and move to IN_DIAGNOSIS', () => {
        const order = new ServiceOrder({ id: '1', customerId: 'c-1', vehicleId: 'v-1' });

        order.registerDiagnosis('  Motor falhando  ');

        expect(order.diagnosis).toBe('Motor falhando');
        expect(order.status).toBe(ServiceOrderStatus.IN_DIAGNOSIS);
    });

    it('should throw when registering empty diagnosis', () => {
        const order = new ServiceOrder({ id: '1', customerId: 'c-1', vehicleId: 'v-1' });

        expect(() => order.registerDiagnosis(' ')).toThrow(DomainException);
    });

    it('should send budget for approval when diagnosis exists', () => {
        const order = new ServiceOrder({
            id: '1', customerId: 'c-1', vehicleId: 'v-1',
            diagnosis: 'Trocar pastilhas',
            status: ServiceOrderStatus.IN_DIAGNOSIS,
        });

        order.sendBudgetForApproval();

        expect(order.status).toBe(ServiceOrderStatus.WAITING_APPROVAL);
    });

    it('should throw when sending budget from a status other than in diagnosis', () => {
        const order = new ServiceOrder({
            id: '1', customerId: 'c-1', vehicleId: 'v-1',
            diagnosis: 'Trocar pastilhas',
            status: ServiceOrderStatus.DELIVERED,
        });

        expect(() => order.sendBudgetForApproval()).toThrow(DomainException);
    });

    it('should throw when registering diagnosis on a finished or delivered order', () => {
        const order = new ServiceOrder({
            id: '1', customerId: 'c-1', vehicleId: 'v-1',
            status: ServiceOrderStatus.DELIVERED,
        });

        expect(() => order.registerDiagnosis('Novo diagnostico')).toThrow(DomainException);
    });

    it('should throw when sending budget without diagnosis', () => {
        const order = new ServiceOrder({ id: '1', customerId: 'c-1', vehicleId: 'v-1' });

        expect(() => order.sendBudgetForApproval()).toThrow(DomainException);
    });

    it('should start execution when APPROVED', () => {
        const order = new ServiceOrder({
            id: '1', customerId: 'c-1', vehicleId: 'v-1',
            status: ServiceOrderStatus.APPROVED,
        });

        order.startExecution();

        expect(order.status).toBe(ServiceOrderStatus.IN_PROGRESS);
        expect(order.startedAt).toBeTruthy();
    });

    it('should keep execution started when already IN_PROGRESS', () => {
        const startedAt = new Date('2026-05-05T12:00:00.000Z');
        const order = new ServiceOrder({
            id: '1', customerId: 'c-1', vehicleId: 'v-1',
            status: ServiceOrderStatus.IN_PROGRESS,
            startedAt,
        });

        order.startExecution();

        expect(order.status).toBe(ServiceOrderStatus.IN_PROGRESS);
        expect(order.startedAt).toBe(startedAt);
    });

    it('should throw when starting execution before approval', () => {
        const order = new ServiceOrder({ id: '1', customerId: 'c-1', vehicleId: 'v-1' });

        expect(() => order.startExecution()).toThrow(DomainException);
    });

    it('should finish when order is in progress', () => {
        const order = new ServiceOrder({
            id: '1', customerId: 'c-1', vehicleId: 'v-1',
            status: ServiceOrderStatus.IN_PROGRESS,
        });

        order.finish();

        expect(order.status).toBe(ServiceOrderStatus.FINISHED);
        expect(order.finishedAt).toBeTruthy();
    });

    it('should throw when finishing an order that is not in progress', () => {
        const order = new ServiceOrder({ id: '1', customerId: 'c-1', vehicleId: 'v-1' });

        expect(() => order.finish()).toThrow(DomainException);
    });

    it('should deliver when order is finished', () => {
        const order = new ServiceOrder({
            id: '1', customerId: 'c-1', vehicleId: 'v-1',
            status: ServiceOrderStatus.FINISHED,
        });

        order.deliver();

        expect(order.status).toBe(ServiceOrderStatus.DELIVERED);
        expect(order.deliveredAt).toBeTruthy();
    });

    it('should throw when delivering an unfinished order', () => {
        const order = new ServiceOrder({ id: '1', customerId: 'c-1', vehicleId: 'v-1' });

        expect(() => order.deliver()).toThrow(DomainException);
    });

    it('should update services amount and recalculate total', () => {
        const order = new ServiceOrder({
            id: '1', customerId: 'c-1', vehicleId: 'v-1',
            stockItemsAmount: 200,
        });

        order.updateServicesAmount(150);
        expect(order.servicesAmount).toBe(150);
        expect(order.totalAmount).toBe(350);
    });

    it('should update stock items amount and recalculate total', () => {
        const order = new ServiceOrder({
            id: '1', customerId: 'c-1', vehicleId: 'v-1',
            servicesAmount: 100,
        });

        order.updateStockItemsAmount(300);
        expect(order.stockItemsAmount).toBe(300);
        expect(order.totalAmount).toBe(400);
    });

    it('should recalculate total correctly', () => {
        const order = new ServiceOrder({
            id: '1', customerId: 'c-1', vehicleId: 'v-1',
            servicesAmount: 100, stockItemsAmount: 200,
        });

        order.recalculateTotal();
        expect(order.totalAmount).toBe(300);
    });

    it('should create with all props', () => {
        const now = new Date();
        const order = new ServiceOrder({
            id: '1', customerId: 'c-1', vehicleId: 'v-1',
            status: ServiceOrderStatus.IN_PROGRESS,
            diagnosis: 'test',
            servicesAmount: 100, stockItemsAmount: 50, totalAmount: 150,
            createdAt: now, startedAt: now, finishedAt: null,
            deliveredAt: null, updatedAt: now,
        });

        expect(order.diagnosis).toBe('test');
        expect(order.status).toBe(ServiceOrderStatus.IN_PROGRESS);
        expect(order.startedAt).toBe(now);
    });
});
