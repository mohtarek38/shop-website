import type { z } from 'zod';
import { RequestValidationException } from '../../shared/http/zod-validation.js';

/** A 400 with a single field error, e.g. `invalidField(['categoryId'], 'not_found')`. */
export function invalidField(
  path: (string | number)[],
  message: string,
): RequestValidationException {
  return new RequestValidationException([{ code: 'custom', path, message, input: undefined }]);
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
