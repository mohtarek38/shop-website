import { ApiError } from '@shop/api-client';
import type { TFunction } from 'i18next';

export interface FieldError {
  /** Dot path matching the form, e.g. `variants.0.price`. Empty for form-level errors. */
  path: string;
  message: string;
}

interface Issue {
  path: string | (string | number | symbol)[];
  code: string;
  message: string;
}

/**
 * The most specific error code of an issue. Our schemas put a code in `message`
 * (e.g. `invalid_slug` on an `invalid_format` issue, `not_found` on a `custom` one);
 * plain Zod issues have a human sentence there, so their `code` is used.
 */
export function issueCode(issue: Pick<Issue, 'code' | 'message'>): string {
  return /^[a-z][a-z0-9_]*$/.test(issue.message) ? issue.message : issue.code;
}

/** Field errors from an API 400 (problem details `errors[]`) or a client-side Zod parse. */
export function fieldErrors(issues: Issue[], t: TFunction): FieldError[] {
  return issues.map((issue) => ({
    path: Array.isArray(issue.path) ? issue.path.map(String).join('.') : issue.path,
    message: errorMessage([issueCode(issue), issue.code], t),
  }));
}

/** A localized message for the first known code, falling back to a generic one. */
export function errorMessage(codes: string | string[], t: TFunction): string {
  for (const code of Array.isArray(codes) ? codes : [codes]) {
    const text = t(`errors.${code}` as never, { defaultValue: '' }) as string;
    if (text) return text;
  }
  return t('errors.invalid' as never) as string;
}

/** Field errors carried by an API error, or `null` if it isn't a validation error. */
export function apiFieldErrors(error: unknown, t: TFunction): FieldError[] | null {
  if (!(error instanceof ApiError) || !error.problem?.errors?.length) return null;
  return fieldErrors(error.problem.errors, t);
}

/** A one-line, user-facing message for any failed request. */
export function apiErrorMessage(error: unknown, t: TFunction): string {
  if (error instanceof ApiError) {
    if (error.status === 409) return error.problem?.detail ?? (t('errors.conflict') as string);
    if (error.status === 403) return t('errors.forbidden') as string;
    if (error.status === 404) return t('errors.not_found') as string;
    if (error.status === 400) return t('errors.check_fields') as string;
  }
  return t('errors.generic') as string;
}
