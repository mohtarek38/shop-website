import type { InventoryListQuery } from '@shop/contracts';
import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { api } from '../../lib/api';

export const inventoryKeys = {
  all: ['inventory'] as const,
  locations: ['inventory', 'locations'] as const,
};

export const locationsQuery = queryOptions({
  queryKey: inventoryKeys.locations,
  queryFn: () => api.admin.stockLocations.list(),
});

export const stockQuery = (query: InventoryListQuery) =>
  queryOptions({
    queryKey: [...inventoryKeys.all, 'list', query],
    queryFn: () => api.admin.inventory.list(query),
    placeholderData: keepPreviousData,
  });

export const movementsQuery = (variantId: string) =>
  queryOptions({
    queryKey: [...inventoryKeys.all, 'movements', variantId],
    queryFn: () => api.admin.inventory.movements(variantId),
  });
