import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { ProblemDetails } from '@shop/contracts';
import type { Request, Response } from 'express';
import { RequestValidationException } from './zod-validation.js';

const TYPE_BASE = 'https://errors.shop/';

/** Renders every error as RFC 9457 Problem Details (PLAN §10). */
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const problem = this.toProblem(exception);
    problem.instance = request.originalUrl;

    if (problem.status >= 500) {
      this.logger.error(exception instanceof Error ? exception.stack : exception);
    }

    response.status(problem.status).type('application/problem+json').json(problem);
  }

  private toProblem(exception: unknown): ProblemDetails {
    if (exception instanceof RequestValidationException) {
      return {
        type: `${TYPE_BASE}validation`,
        title: 'Request validation failed',
        status: HttpStatus.BAD_REQUEST,
        errors: exception.issues.map((issue) => ({
          path: issue.path.join('.'),
          code: issue.code,
          message: issue.message,
        })),
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const detail =
        typeof body === 'string'
          ? body
          : typeof body === 'object' && body && 'message' in body
            ? String((body as { message: unknown }).message)
            : undefined;
      return {
        type: `${TYPE_BASE}${slug(HttpStatus[status] ?? 'error')}`,
        title: exception.name.replace(/Exception$/, '').replace(/([a-z])([A-Z])/g, '$1 $2'),
        status,
        detail,
      };
    }

    // Unknown errors: never leak internals to the client.
    return {
      type: `${TYPE_BASE}internal`,
      title: 'Internal Server Error',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    };
  }
}

function slug(value: string): string {
  return value.toLowerCase().replace(/_/g, '-');
}
