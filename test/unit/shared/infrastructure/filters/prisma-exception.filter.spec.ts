import { HttpStatus } from '@nestjs/common';
import { PrismaExceptionFilter } from '../../../../../src/shared/infrastructure/filters/prisma-exception.filter';
import { Prisma } from '@prisma/client';

describe('PrismaExceptionFilter', () => {
  let filter: PrismaExceptionFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockHost: any;

  beforeEach(() => {
    filter = new PrismaExceptionFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockHost = {
      switchToHttp: () => ({
        getResponse: () => ({ status: mockStatus }),
      }),
    };
  });

  it('should return 409 for unique constraint violation (P2002)', () => {
    const exception = new Prisma.PrismaClientKnownRequestError('', {
      code: 'P2002',
      clientVersion: '5.0.0',
    });

    filter.catch(exception, mockHost);
    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.CONFLICT);
  });

  it('should return 404 for foreign key constraint (P2003)', () => {
    const exception = new Prisma.PrismaClientKnownRequestError('', {
      code: 'P2003',
      clientVersion: '5.0.0',
    });

    filter.catch(exception, mockHost);
    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
  });

  it('should return 404 for record not found (P2025)', () => {
    const exception = new Prisma.PrismaClientKnownRequestError('', {
      code: 'P2025',
      clientVersion: '5.0.0',
    });

    filter.catch(exception, mockHost);
    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
  });

  it('should return 500 for unknown Prisma errors', () => {
    const exception = new Prisma.PrismaClientKnownRequestError('', {
      code: 'P9999',
      clientVersion: '5.0.0',
    });

    filter.catch(exception, mockHost);
    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Database error.',
      error: 'Internal Server Error',
    });
  });
});
