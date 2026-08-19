import { NotFoundException } from '@nestjs/common';
import { FindServiceOrdersByDocumentUseCase } from '../../../../../../src/modules/service-orders/application/use-cases/find-service-orders-by-document.use-case';

describe('FindServiceOrdersByDocumentUseCase', () => {
  let useCase: FindServiceOrdersByDocumentUseCase;
  let serviceOrderRepo: any;
  let customerRepo: any;

  beforeEach(() => {
    serviceOrderRepo = {
      findByCustomerId: jest.fn(),
      findDetailsById: jest.fn(),
    };
    customerRepo = { findByDocument: jest.fn() };
    useCase = new FindServiceOrdersByDocumentUseCase(
      serviceOrderRepo,
      customerRepo,
    );
  });

  it('should return service orders by customer document', async () => {
    customerRepo.findByDocument.mockResolvedValue({ id: 'c-1' });
    serviceOrderRepo.findByCustomerId.mockResolvedValue([{ id: 'so-1' }]);
    serviceOrderRepo.findDetailsById.mockResolvedValue({
      id: 'so-1',
      totalAmount: 500,
    });

    const result = await useCase.execute('52998224725');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('so-1');
  });

  it('should throw NotFoundException when customer not found', async () => {
    customerRepo.findByDocument.mockResolvedValue(null);
    await expect(useCase.execute('00000000000')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should return empty array when no orders', async () => {
    customerRepo.findByDocument.mockResolvedValue({ id: 'c-1' });
    serviceOrderRepo.findByCustomerId.mockResolvedValue([]);
    const result = await useCase.execute('52998224725');
    expect(result).toHaveLength(0);
  });
});
