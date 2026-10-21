import type { z } from 'zod';
import { RequestValidationException } from './zod-validation.js';

/** A 400 with a single field error, e.g. `invalidField(['categoryId'], 'not_found')`. */
export function invalidField(
  path: (string | number)[],
  message: string,
): RequestValidationException {
  return new RequestValidationException([{ code: 'custom', path, message, input: undefined }]);
}

/** A 400 marking each path as already in use (unique slugs, SKUs). */
export function alreadyExists(paths: (string | number)[][]): RequestValidationException {
  return new RequestValidationException(
    paths.map((path) => ({ code: 'custom', path, message: 'already_exists', input: undefined })),
  );
}

/** Re-throws Zod issues from a nested schema with their full path (e.g. `specs.capacity`). */
export function nestedValidationError(
  prefix: (string | number)[],
  issues: z.core.$ZodIssue[],
): RequestValidationException {
  return new RequestValidationException(
    issues.map((issue) => ({ ...issue, path: [...prefix, ...issue.path] })),
  );
}
