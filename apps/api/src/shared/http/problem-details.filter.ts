import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { STATUS_CODES } from 'node:http';
import type { ProblemDetails } from '@shop/contracts';
import type { Request, Response } from 'express';
import { Prisma } from '../../generated/prisma/client.js';
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
          path: issue.path.map(String).join('.'),
          code: issue.code,
          message: issue.message,
        })),
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const mapped = fromPrismaError(exception);
      if (mapped) return mapped;
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
        title: STATUS_CODES[status] ?? 'Error',
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

/**
 * Database constraint errors that reach the client as normal 4xx responses, so services
 * don't need a pre-check for every unique field. Anything else stays a 500.
 */
function fromPrismaError(error: Prisma.PrismaClientKnownRequestError): ProblemDetails | null {
  switch (error.code) {
    case 'P2002': {
      // Unique constraint, e.g. a slug or SKU that already exists.
      const target = error.meta?.target;
      const fields = Array.isArray(target) ? target.map(String) : [];
      return {
        type: `${TYPE_BASE}conflict`,
        title: 'Conflict',
        status: HttpStatus.CONFLICT,
        detail: fields.length ? `Already in use: ${fields.join(', ')}` : 'Already exists',
        errors: fields.map((path) => ({ path, code: 'already_exists', message: 'already_exists' })),
      };
    }
    case 'P2003': // Foreign key: referenced row missing, or row still referenced.
      return {
        type: `${TYPE_BASE}conflict`,
        title: 'Conflict',
        status: HttpStatus.CONFLICT,
        detail: 'Related record is missing or still in use',
      };
    case 'P2025': // Record to update/delete not found.
      return {
        type: `${TYPE_BASE}not-found`,
        title: 'Not Found',
        status: HttpStatus.NOT_FOUND,
      };
    default:
      return null;
  }
}

function slug(value: string): string {
  return value.toLowerCase().replace(/_/g, '-');
}
