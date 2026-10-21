import { BadRequestException, Body, Query, type PipeTransform } from '@nestjs/common';
import { ApiBody, ApiQuery } from '@nestjs/swagger';
import { z } from 'zod';

/** Thrown when a request fails schema validation; rendered as a 400 Problem Details response. */
export class RequestValidationException extends BadRequestException {
  constructor(readonly issues: z.core.$ZodIssue[]) {
    super('Request validation failed');
  }
}

/** Validates and transforms input with a shared `@shop/contracts` schema (ADR-0022). */
export class ZodValidationPipe<T extends z.ZodType> implements PipeTransform {
  constructor(private readonly schema: T) {}

  transform(value: unknown): z.output<T> {
    const result = this.schema.safeParse(value);
    if (!result.success) throw new RequestValidationException(result.error.issues);
    return result.data;
  }
}

function toOpenApi(schema: z.ZodType) {
  return z.toJSONSchema(schema, { target: 'openapi-3.0', io: 'input', unrepresentable: 'any' });
}

type ParamDecoratorArgs = [target: object, key: string | symbol | undefined, index: number];

function describeMethod(
  target: object,
  key: string | symbol | undefined,
  decorator: MethodDecorator,
) {
  if (key === undefined) return;
  const descriptor = Object.getOwnPropertyDescriptor(target, key);
  if (descriptor) decorator(target, key, descriptor);
}

/** `@ZodBody(schema) body: T`: validates the body and documents it in OpenAPI. */
export function ZodBody(schema: z.ZodType): ParameterDecorator {
  return (...[target, key, index]: ParamDecoratorArgs) => {
    Body(new ZodValidationPipe(schema))(target, key, index);
    describeMethod(target, key, ApiBody({ schema: toOpenApi(schema) as object }));
  };
}

/** `@ZodQuery(schema) query: T`: validates the query string and documents each parameter. */
export function ZodQuery(schema: z.ZodObject): ParameterDecorator {
  return (...[target, key, index]: ParamDecoratorArgs) => {
    Query(new ZodValidationPipe(schema))(target, key, index);
    for (const [name, field] of Object.entries(schema.shape)) {
      describeMethod(
        target,
        key,
        ApiQuery({
          name,
          required: !(field as z.ZodType).safeParse(undefined).success,
          schema: toOpenApi(field as z.ZodType) as object,
        }),
      );
    }
  };
}
