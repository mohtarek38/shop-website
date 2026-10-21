import { ApiError, createApiClient } from '@shop/api-client';
import { QueryClient, queryOptions } from '@tanstack/react-query';

export const api = createApiClient();

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Don't retry auth/permission errors; they won't fix themselves.
      retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 2,
    },
  },
});

export const meQuery = queryOptions({
  queryKey: ['me'],
  queryFn: () => api.me.get(),
  staleTime: 60_000,
});

export { ApiError };
