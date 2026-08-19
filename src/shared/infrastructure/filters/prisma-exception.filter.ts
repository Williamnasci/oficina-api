import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let mappedError: ConflictException | NotFoundException | null = null;

    if (exception.code === 'P2002') {
      mappedError = new ConflictException('Unique constraint violation.');
    }

    if (exception.code === 'P2003') {
      mappedError = new NotFoundException('Related record not found.');
    }

    if (exception.code === 'P2025') {
      mappedError = new NotFoundException('Record not found.');
    }

    if (mappedError) {
      const status = mappedError.getStatus();
      const errorResponse = mappedError.getResponse();

      response.status(status).json(
        typeof errorResponse === 'string'
          ? {
              statusCode: status,
              message: errorResponse,
              error: HttpStatus[status],
            }
          : errorResponse,
      );

      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Database error.',
      error: 'Internal Server Error',
    });
  }
}
