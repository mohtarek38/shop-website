import { z } from 'zod';
import type { Specs } from './catalog';
import type { ProductStatus } from './catalog';
import { paginationQuerySchema } from './http';
import { type LocalizedText, localizedTextSchema } from './localized-text';

// ─── Locations ─────────────────────────────────────────────────────────────

export const stockLocationInputSchema = z.object({
  /** Short uppercase code shown in lists, e.g. MAIN, NASR-CITY. */
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{2,20}$/, 'invalid_location_code'),
  name: localizedTextSchema,
  address: z
    .string()
    .trim()
    .max(300)
    .nullable()
    .default(null)
    .transform((value) => value || null),
  /** New orders reserve stock here first (ADR-0013). Exactly one location is the default. */
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});
export type StockLocationInput = z.input<typeof stockLocationInputSchema>;

export interface StockLocation {
  id: string;
  code: string;
  name: LocalizedText;
  address: string | null;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
}

// ─── Stock changes ─────────────────────────────────────────────────────────

/**
 * Manual stock changes by staff:
 * - receive: add `quantity` (goods arrived)
 * - adjust: set on-hand to the counted `quantity` (stock count)
 * - write_off: remove `quantity` (damaged, lost)
 */
export const STOCK_ADJUSTMENT_TYPES = ['receive', 'adjust', 'write_off'] as const;
export type StockAdjustmentType = (typeof STOCK_ADJUSTMENT_TYPES)[number];

export const stockAdjustmentInputSchema = z
  .object({
    variantId: z.uuid(),
    locationId: z.uuid(),
    type: z.enum(STOCK_ADJUSTMENT_TYPES),
    quantity: z.number().int().min(0).max(100_000),
    reason: z
      .string()
      .trim()
      .max(200)
      .optional()
      .transform((value) => value || undefined),
  })
  .superRefine((input, ctx) => {
    if (input.type !== 'adjust' && input.quantity < 1) {
      ctx.addIssue({ code: 'custom', path: ['quantity'], message: 'quantity_required' });
    }
    if (input.type !== 'receive' && !input.reason) {
      ctx.addIssue({ code: 'custom', path: ['reason'], message: 'reason_required' });
    }
  });
export type StockAdjustmentInput = z.input<typeof stockAdjustmentInputSchema>;

export const stockTransferInputSchema = z
  .object({
    variantId: z.uuid(),
    fromLocationId: z.uuid(),
    toLocationId: z.uuid(),
    quantity: z.number().int().min(1).max(100_000),
    reason: z
      .string()
      .trim()
      .max(200)
      .optional()
      .transform((value) => value || undefined),
  })
  .refine((input) => input.fromLocationId !== input.toLocationId, {
    path: ['toLocationId'],
    message: 'same_location',
  });
export type StockTransferInput = z.input<typeof stockTransferInputSchema>;

export const lowStockThresholdInputSchema = z.object({
  variantId: z.uuid(),
  locationId: z.uuid(),
  /** Warn when available stock is at or below this; null turns the warning off. */
  lowStockThreshold: z.number().int().min(0).max(100_000).nullable(),
});
export type LowStockThresholdInput = z.input<typeof lowStockThresholdInputSchema>;

// ─── Reading stock ─────────────────────────────────────────────────────────

export const inventoryListQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().max(100).optional(),
  /** Only variants that are out of stock or at/below a low-stock threshold. */
  lowStock: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
});
export type InventoryListQuery = {
  page?: number;
  pageSize?: number;
  q?: string;
  lowStock?: boolean;
};

export interface InventoryLevel {
  locationId: string;
  onHand: number;
  reserved: number;
  available: number;
  lowStockThreshold: number | null;
  isLow: boolean;
}

/** One variant with its stock at every active location. */
export interface InventoryRow {
  variantId: string;
  sku: string;
  options: Specs;
  variantActive: boolean;
  product: { id: string; name: LocalizedText; status: ProductStatus };
  levels: InventoryLevel[];
  total: { onHand: number; reserved: number; available: number };
  /** Out of stock everywhere, or at/below a threshold somewhere. */
  needsAttention: boolean;
}

export const STOCK_MOVEMENT_TYPES = [
  'receive',
  'adjust',
  'write_off',
  'transfer_out',
  'transfer_in',
  'reserve',
  'release',
  'fulfil',
  'return',
] as const;
export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];

export interface StockMovement {
  id: string;
  type: StockMovementType;
  location: { id: string; code: string; name: LocalizedText };
  onHandDelta: number;
  reservedDelta: number;
  onHandAfter: number;
  reason: string | null;
  actorName: string | null;
  createdAt: string;
}

/** Storefront availability for a variant (summed over active locations). */
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';
