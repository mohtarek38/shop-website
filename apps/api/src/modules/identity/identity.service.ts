import {
  ConflictException,
  HttpException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  isSyntheticEmail,
  type Me,
  registerCustomerSchema,
  syntheticEmailForPhone,
} from '@shop/contracts';
import { APIError } from 'better-auth/api';
import type { z } from 'zod';
import type { Auth } from './auth.js';
import { IdentityRepository } from './identity.repository.js';
import { AUTH } from './identity.tokens.js';
import type { AuthContext } from './request-auth.js';

type RegisterCustomer = z.output<typeof registerCustomerSchema>;

@Injectable()
export class IdentityService {
  constructor(
    @Inject(AUTH) private readonly auth: Auth,
    private readonly identity: IdentityRepository,
  ) {}

  /**
   * Creates a customer account with phone + password and signs them in.
   * Returns the Set-Cookie headers to forward to the client.
   */
  async registerCustomer(input: RegisterCustomer, requestHeaders: Headers): Promise<Headers> {
    try {
      const { headers, response } = await this.auth.api.signUpEmail({
        body: {
          name: input.name,
          email: input.email ?? syntheticEmailForPhone(input.phone),
          password: input.password,
          username: input.phone,
          displayUsername: input.phone,
        },
        headers: requestHeaders,
        returnHeaders: true,
      });
      if (input.locale !== 'ar') await this.identity.setUserLocale(response.user.id, input.locale);
      return headers;
    } catch (error) {
      throw toHttpException(error);
    }
  }

  async getMe(auth: AuthContext): Promise<Me> {
    const access = await this.identity.findUserAccess(auth.user.id);
    if (!access) throw new NotFoundException();
    const user = auth.user as AuthContext['user'] & { username?: string | null; locale?: string };
    return {
      id: user.id,
      name: user.name,
      email: isSyntheticEmail(user.email) ? null : user.email,
      phone: user.username ?? null,
      type: access.type,
      locale: user.locale === 'en' ? 'en' : 'ar',
      roles: access.roles,
      permissions: access.permissions,
    };
  }
}

/** Better Auth errors aren't Nest exceptions; convert them so clients get the right status. */
function toHttpException(error: unknown): unknown {
  if (!(error instanceof APIError)) return error;
  const code = (error.body as { code?: string } | undefined)?.code ?? '';
  // USERNAME_IS_ALREADY_TAKEN (phone) or USER_ALREADY_EXISTS… (email)
  if (code.includes('ALREADY')) {
    return new ConflictException('An account with this phone number or email already exists');
  }
  return new HttpException(error.message, error.statusCode);
}
