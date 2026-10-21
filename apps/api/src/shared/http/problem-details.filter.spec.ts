import type { ArgumentsHost } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { ProblemDetailsFilter } from './problem-details.filter.js';

function render(exception: unknown) {
  let body: unknown;
  let status = 0;
  const response = {
    status: (code: number) => ((status = code), response),
    type: () => response,
    json: (value: unknown) => (body = value),
  };
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({ originalUrl: '/api/v1/x' }),
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;
  new ProblemDetailsFilter().catch(exception, host);
  return { status, body };
}

describe('ProblemDetailsFilter: database constraint errors', () => {
  it('names the field of a unique violation reported by the pg driver adapter', () => {
    const error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: 'test',
      meta: {
        modelName: 'ProductVariant',
        driverAdapterError: {
          cause: { table: 'product_variant', constraint: { index: 'product_variant_sku_key' } },
        },
      },
    });
    expect(render(error)).toMatchObject({
      status: 409,
      body: { title: 'Conflict', errors: [{ path: 'sku', message: 'already_exists' }] },
    });
  });

  it('maps a missing record to 404', () => {
    const error = new Prisma.PrismaClientKnownRequestError('Not found', {
      code: 'P2025',
      clientVersion: 'test',
    });
    expect(render(error).status).toBe(404);
  });
});
