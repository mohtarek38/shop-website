import { describe, expect, it, vi } from 'vitest';
import { ApiError, createApiClient } from './index';

function jsonResponse(status: number, body: unknown, contentType = 'application/json') {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': contentType } });
}

describe('createApiClient', () => {
  it('sends JSON with credentials and parses the response', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse(200, { id: '1', name: 'Owner' }));
    const api = createApiClient({ fetch });

    await expect(api.me.get()).resolves.toMatchObject({ name: 'Owner' });
    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/me',
      expect.objectContaining({ method: 'GET', credentials: 'include' }),
    );
  });

  it('normalizes the phone number before signing in', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse(200, {}));
    await createApiClient({ fetch }).auth.signInWithPhone('0101 234 5678', 'secret-123');

    const body = JSON.parse(fetch.mock.calls[0]![1].body as string);
    expect(body).toEqual({ username: '+201012345678', password: 'secret-123' });
  });

  it('throws ApiError with problem details', async () => {
    const problem = { type: 'x', title: 'Forbidden', status: 403, detail: 'No permission' };
    const fetch = vi.fn().mockResolvedValue(jsonResponse(403, problem, 'application/problem+json'));

    const error = await createApiClient({ fetch })
      .me.get()
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(403);
    expect((error as ApiError).message).toBe('No permission');
  });

  it('wraps Better Auth error bodies', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(401, { code: 'INVALID_EMAIL_OR_PASSWORD', message: 'Invalid' }),
      );

    const error = (await createApiClient({ fetch })
      .auth.signInWithEmail('a@b.c', 'x')
      .catch((e: unknown) => e)) as ApiError;
    expect(error.status).toBe(401);
    expect(error.problem?.title).toBe('Invalid');
  });
});

describe('admin catalog client', () => {
  it('builds list queries without empty values', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse(200, { items: [], total: 0 }));
    await createApiClient({ fetch }).admin.products.list({
      q: 'ثلاجة',
      page: 2,
      status: undefined,
    });
    expect(fetch.mock.calls[0]![0]).toBe(
      `/api/v1/admin/products?q=${encodeURIComponent('ثلاجة')}&page=2`,
    );
  });

  it('handles 204 No Content on delete', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    await expect(createApiClient({ fetch }).admin.brands.remove('id-1')).resolves.toBeUndefined();
    expect(fetch.mock.calls[0]![1]).toMatchObject({ method: 'DELETE' });
  });
});
