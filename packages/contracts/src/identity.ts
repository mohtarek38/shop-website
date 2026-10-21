import { z } from 'zod';
import { localeSchema } from './locale';
import { type Permission } from './permissions';
import { egyptianMobileSchema } from './phone';

export const PASSWORD_MIN_LENGTH = 8;
export const passwordSchema = z.string().min(PASSWORD_MIN_LENGTH).max(128);

/** Customer self-registration with phone + password (ADR-0009). Email is optional. */
export const registerCustomerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: egyptianMobileSchema,
  password: passwordSchema,
  email: z.email().optional(),
  locale: localeSchema.default('ar'),
});
export type RegisterCustomerInput = z.input<typeof registerCustomerSchema>;

export const userTypeSchema = z.enum(['customer', 'staff']);
export type UserType = z.infer<typeof userTypeSchema>;

/** The signed-in user as returned by GET /api/v1/me. */
export const meSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** Null when the account has only a phone number. */
  email: z.string().nullable(),
  phone: z.string().nullable(),
  type: userTypeSchema,
  locale: localeSchema,
  roles: z.array(z.string()),
  permissions: z.array(z.string()) as z.ZodType<Permission[]>,
});
export type Me = z.infer<typeof meSchema>;

/** Fields a signed-in user can change on their own account. */
export const updateMeSchema = z.object({ locale: localeSchema });
export type UpdateMeInput = z.infer<typeof updateMeSchema>;

/** Phone-only accounts get a non-deliverable address; email senders must skip these. */
export const SYNTHETIC_EMAIL_DOMAIN = 'phone.invalid';

export function syntheticEmailForPhone(e164: string): string {
  return `${e164.replace(/^\+/, '')}@${SYNTHETIC_EMAIL_DOMAIN}`;
}

export function isSyntheticEmail(email: string): boolean {
  return email.endsWith(`@${SYNTHETIC_EMAIL_DOMAIN}`);
}
