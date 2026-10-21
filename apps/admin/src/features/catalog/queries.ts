import type { ProductListQuery } from '@shop/contracts';
import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { api } from '../../lib/api';

export const catalogKeys = {
  categories: ['catalog', 'categories'] as const,
  brands: ['catalog', 'brands'] as const,
  products: ['catalog', 'products'] as const,
};

export const categoriesQuery = queryOptions({
  queryKey: catalogKeys.categories,
  queryFn: () => api.admin.categories.list(),
});

export const brandsQuery = queryOptions({
  queryKey: catalogKeys.brands,
  queryFn: () => api.admin.brands.list(),
});

export const productsQuery = (query: ProductListQuery) =>
  queryOptions({
    queryKey: [...catalogKeys.products, 'list', query],
    queryFn: () => api.admin.products.list(query),
    placeholderData: keepPreviousData,
  });

export const productQuery = (id: string) =>
  queryOptions({
    queryKey: [...catalogKeys.products, 'detail', id],
    queryFn: () => api.admin.products.get(id),
  });
