import { HttpStatus } from '@nestjs/common';
import { DomainExceptionFilter } from '../../../../../src/shared/infrastructure/filters/domain-exception.filter';
import { DomainException } from '../../../../../src/shared/domain/errors/domain.exception';

describe('DomainExceptionFilter', () => {
  let filter: DomainExceptionFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockHost: any;

  beforeEach(() => {
    filter = new DomainExceptionFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockHost = {
      switchToHttp: () => ({
        getResponse: () => ({ status: mockStatus }),
      }),
    };
  });

  it('should return 422 with domain exception message', () => {
    const exception = new DomainException('Something went wrong');
    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message: 'Something went wrong',
      error: 'Unprocessable Entity',
    });
  });
});
