import {
  type Brand,
  type BrandInput,
  type Category,
  type CategoryInput,
  type InventoryListQuery,
  type InventoryRow,
  type Locale,
  type LowStockThresholdInput,
  type MediaAsset,
  type Me,
  normalizeEgyptianMobile,
  type Product,
  type ProductInput,
  type ProductListItem,
  type ProductListQuery,
  type ProductStatus,
  type ProblemDetails,
  type RegisterCustomerInput,
  type StockAdjustmentInput,
  type StockLocation,
  type StockLocationInput,
  type StockMovement,
  type StockTransferInput,
} from '@shop/contracts';

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

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
    // FormData (file uploads) sets its own multipart content type.
    const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
    const response = await doFetch(`${baseUrl}${path}`, {
      method,
      credentials: 'include',
      headers: body === undefined || isForm ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
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

    /** Staff-only endpoints (permission-guarded by the API). */
    admin: {
      stockLocations: {
        list: () => request<StockLocation[]>('GET', '/api/v1/admin/stock-locations'),
        create: (input: StockLocationInput) =>
          request<StockLocation>('POST', '/api/v1/admin/stock-locations', input),
        update: (id: string, input: StockLocationInput) =>
          request<StockLocation>('PUT', `/api/v1/admin/stock-locations/${id}`, input),
      },
      inventory: {
        list: (query: InventoryListQuery = {}) =>
          request<Page<InventoryRow>>('GET', `/api/v1/admin/inventory${toQuery(query)}`),
        movements: (variantId: string) =>
          request<StockMovement[]>('GET', `/api/v1/admin/inventory/${variantId}/movements`),
        adjust: (input: StockAdjustmentInput) =>
          request<void>('POST', '/api/v1/admin/inventory/adjustments', input),
        transfer: (input: StockTransferInput) =>
          request<void>('POST', '/api/v1/admin/inventory/transfers', input),
        setThreshold: (input: LowStockThresholdInput) =>
          request<void>('PUT', '/api/v1/admin/inventory/thresholds', input),
      },
      media: {
        /** Uploads one product image; the API stores resized WebP versions. */
        uploadImage: (file: Blob, filename = 'image') => {
          const form = new FormData();
          form.append('file', file, filename);
          return request<MediaAsset>('POST', '/api/v1/admin/media/images', form);
        },
      },
      categories: crud<Category, CategoryInput>(request, '/api/v1/admin/categories'),
      brands: crud<Brand, BrandInput>(request, '/api/v1/admin/brands'),
      products: {
        list: (query: ProductListQuery = {}) =>
          request<Page<ProductListItem>>('GET', `/api/v1/admin/products${toQuery(query)}`),
        get: (id: string) => request<Product>('GET', `/api/v1/admin/products/${id}`),
        create: (input: ProductInput) => request<Product>('POST', '/api/v1/admin/products', input),
        update: (id: string, input: ProductInput) =>
          request<Product>('PUT', `/api/v1/admin/products/${id}`, input),
        setStatus: (id: string, status: ProductStatus) =>
          request<Product>('PATCH', `/api/v1/admin/products/${id}/status`, { status }),
        remove: (id: string) => request<void>('DELETE', `/api/v1/admin/products/${id}`),
      },
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

type RequestFn = <T>(method: Method, path: string, body?: unknown) => Promise<T>;

function crud<T, Input>(request: RequestFn, base: string) {
  return {
    list: () => request<T[]>('GET', base),
    get: (id: string) => request<T>('GET', `${base}/${id}`),
    create: (input: Input) => request<T>('POST', base, input),
    update: (id: string, input: Input) => request<T>('PUT', `${base}/${id}`, input),
    remove: (id: string) => request<void>('DELETE', `${base}/${id}`),
  };
}

/** `?a=1&b=x`, skipping empty values. */
function toQuery(params: Record<string, string | number | boolean | undefined>): string {
  const entries = Object.entries(params).filter(
    (entry): entry is [string, string | number | boolean] =>
      entry[1] !== undefined && entry[1] !== '' && entry[1] !== false,
  );
  return entries.length ? `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)]))}` : '';
}

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
