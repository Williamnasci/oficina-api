import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { MetricsService } from './metrics.service';

type HttpErrorWithStatus = Error & {
  getStatus?: () => number;
};

// @types/express tipa Request.route como `any` - Omit+intersect (nao & puro,
// que colapsaria pra `any` de novo) para sobrescrever com um tipo seguro.
type RequestWithTypedRoute = Omit<Request, 'route'> & {
  route?: { path?: string };
};

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<RequestWithTypedRoute>();
    const response = http.getResponse<Response>();
    const start = process.hrtime.bigint();
    let statusCode = response.statusCode;

    return next.handle().pipe(
      tap(() => {
        statusCode = response.statusCode;
      }),
      catchError((error: HttpErrorWithStatus) => {
        statusCode = error.getStatus?.() ?? 500;
        return throwError(() => error);
      }),
      finalize(() => {
        const durationSeconds =
          Number(process.hrtime.bigint() - start) / 1_000_000_000;
        const route = String(request.route?.path ?? request.path ?? 'unknown');

        this.metricsService.recordHttpRequest(
          request.method,
          route,
          statusCode,
          durationSeconds,
        );
      }),
    );
  }
}
