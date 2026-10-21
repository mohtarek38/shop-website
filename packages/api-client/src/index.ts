import {
  type Locale,
  type Me,
  normalizeEgyptianMobile,
  type ProblemDetails,
  type RegisterCustomerInput,
} from '@shop/contracts';

/** An API error response, carrying the RFC 9457 problem details from the server. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly problem: ProblemDetails | null,
  ) {
    super(problem?.detail ?? problem?.title ?? `Request failed with status ${status}`);
    this.name = 'ApiError';
  }
}

export interface ApiClientOptions {
  /** Empty in the browser: the API is served same-origin under /api (ADR-0015). */
  baseUrl?: string;
  fetch?: typeof fetch;
}

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

/** Typed client for the shop API, used by the storefront and the dashboard. */
export function createApiClient(options: ApiClientOptions = {}) {
  const baseUrl = options.baseUrl ?? '';
  const doFetch = options.fetch ?? globalThis.fetch.bind(globalThis);

  async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
    const response = await doFetch(`${baseUrl}${path}`, {
      method,
      credentials: 'include',
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!response.ok) throw new ApiError(response.status, await readProblem(response));
    if (response.status === 204) return undefined as T;
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  return {
    request,

    auth: {
      /** Staff (and customers with an email) sign in with email + password. */
      signInWithEmail: (email: string, password: string) =>
        request<unknown>('POST', '/api/auth/sign-in/email', { email, password }),

      /** Customers sign in with their phone number + password. */
      signInWithPhone: (phone: string, password: string) =>
        request<unknown>('POST', '/api/auth/sign-in/username', {
          username: normalizeEgyptianMobile(phone) ?? phone,
          password,
        }),

      registerCustomer: (input: RegisterCustomerInput) =>
        request<{ ok: true }>('POST', '/api/v1/auth/register', input),

      signOut: () => request<unknown>('POST', '/api/auth/sign-out', {}),
    },

    me: {
      get: () => request<Me>('GET', '/api/v1/me'),
      update: (input: { locale: Locale }) => request<Me>('PATCH', '/api/v1/me', input),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

async function readProblem(response: Response): Promise<ProblemDetails | null> {
  try {
    const data = (await response.json()) as Partial<ProblemDetails> & { message?: string };
    // Better Auth endpoints return { code, message } rather than problem details.
    if (typeof data.title !== 'string') {
      return {
        type: 'about:blank',
        title: data.message ?? response.statusText,
        status: response.status,
      };
    }
    return data as ProblemDetails;
  } catch {
    return null;
  }
}
