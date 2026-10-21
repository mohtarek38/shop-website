import { randomUUID } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  type InventoryLevel,
  type InventoryRow,
  type inventoryListQuerySchema,
  type LocalizedText,
  type lowStockThresholdInputSchema,
  normalizeArabic,
  type ProductStatus,
  type Specs,
  type StockLocation,
  type stockAdjustmentInputSchema,
  type stockLocationInputSchema,
  type StockMovement,
  type StockStatus,
  type stockTransferInputSchema,
} from '@shop/contracts';
import type { z } from 'zod';
import { alreadyExists, invalidField } from '../../shared/http/field-errors.js';
import { InventoryRepository, type LocationRow, type StockChange } from './inventory.repository.js';

type LocationInput = z.output<typeof stockLocationInputSchema>;
type AdjustmentInput = z.output<typeof stockAdjustmentInputSchema>;
type TransferInput = z.output<typeof stockTransferInputSchema>;
type ThresholdInput = z.output<typeof lowStockThresholdInputSchema>;
type ListQuery = z.output<typeof inventoryListQuerySchema>;

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

/** Stock levels per variant and location, changed only through ledgered movements (ADR-0013). */
@Injectable()
export class InventoryService {
  constructor(private readonly inventory: InventoryRepository) {}

  // ─── Locations ───────────────────────────────────────────────────────────

  async locations(): Promise<StockLocation[]> {
    return (await this.inventory.findLocations()).map(toLocation);
  }

  async saveLocation(id: string | null, input: LocationInput): Promise<StockLocation> {
    if (id && !(await this.inventory.findLocation(id))) {
      throw new NotFoundException('Location not found');
    }
    if (await this.inventory.isCodeTaken(input.code, id ?? undefined)) {
      throw alreadyExists([['code']]);
    }
    if (id && !input.isDefault) {
      // The default can only move to another location, never disappear.
      const current = await this.inventory.findLocation(id);
      if (current?.isDefault) throw invalidField(['isDefault'], 'default_required');
    }
    const locations = await this.inventory.findLocations();
    const isDefault = input.isDefault || locations.length === 0;
    if (isDefault && !input.isActive) throw invalidField(['isActive'], 'default_must_be_active');
    return toLocation(await this.inventory.saveLocation(id, { ...input, isDefault }));
  }

  // ─── Changes ─────────────────────────────────────────────────────────────

  /** `actorId` is null for system actions (seed, imports). */
  async adjust(input: AdjustmentInput, actorId: string | null): Promise<void> {
    await this.assertVariant(input.variantId);
    await this.assertLocation(input.locationId);

    const change: StockChange = ({ onHand, reserved }) => {
      if (input.type === 'receive') return { type: 'receive', onHandDelta: input.quantity };
      if (input.type === 'write_off') {
        if (input.quantity > onHand - reserved) {
          throw invalidField(['quantity'], 'insufficient_stock');
        }
        return { type: 'write_off', onHandDelta: -input.quantity };
      }
      // adjust: the counted quantity becomes the new on-hand.
      if (input.quantity < reserved) throw invalidField(['quantity'], 'below_reserved');
      return { type: 'adjust', onHandDelta: input.quantity - onHand };
    };

    await this.inventory.applyChanges(
      [{ variantId: input.variantId, locationId: input.locationId, change }],
      { reason: input.reason, actorId },
    );
  }

  async transfer(input: TransferInput, actorId: string | null): Promise<void> {
    await this.assertVariant(input.variantId);
    await this.assertLocation(input.fromLocationId);
    await this.assertLocation(input.toLocationId);

    await this.inventory.applyChanges(
      [
        {
          variantId: input.variantId,
          locationId: input.fromLocationId,
          change: ({ onHand, reserved }) => {
            if (input.quantity > onHand - reserved) {
              throw invalidField(['quantity'], 'insufficient_stock');
            }
            return { type: 'transfer_out', onHandDelta: -input.quantity };
          },
        },
        {
          variantId: input.variantId,
          locationId: input.toLocationId,
          change: () => ({ type: 'transfer_in', onHandDelta: input.quantity }),
        },
      ],
      // Both halves share a reference id so the history can pair them.
      { reason: input.reason, actorId, referenceType: 'transfer', referenceId: randomUUID() },
    );
  }

  async setThreshold(input: ThresholdInput): Promise<void> {
    await this.assertVariant(input.variantId);
    await this.assertLocation(input.locationId);
    await this.inventory.setThreshold(input.variantId, input.locationId, input.lowStockThreshold);
  }

  // ─── Reads ───────────────────────────────────────────────────────────────

  /**
   * Stock per variant across active locations. Filtering and paging happen in memory:
   * fine for a catalog of hundreds of products (a few thousand variants at most).
   */
  async list(query: ListQuery): Promise<Paginated<InventoryRow>> {
    const locations = (await this.inventory.findLocations()).filter((l) => l.isActive);
    const words = query.q ? normalizeArabic(query.q).split(' ').filter(Boolean) : [];
    const variants = await this.inventory.findVariantsWithStock(words);

    let rows = variants.map((variant): InventoryRow => {
      const levels = locations.map((location): InventoryLevel => {
        const level = variant.stockLevels.find((l) => l.locationId === location.id);
        const onHand = level?.onHand ?? 0;
        const reserved = level?.reserved ?? 0;
        const available = onHand - reserved;
        const threshold = level?.lowStockThreshold ?? null;
        return {
          locationId: location.id,
          onHand,
          reserved,
          available,
          lowStockThreshold: threshold,
          isLow: threshold !== null && available <= threshold,
        };
      });
      const total = levels.reduce(
        (sum, l) => ({
          onHand: sum.onHand + l.onHand,
          reserved: sum.reserved + l.reserved,
          available: sum.available + l.available,
        }),
        { onHand: 0, reserved: 0, available: 0 },
      );
      return {
        variantId: variant.id,
        sku: variant.sku,
        options: variant.options as Specs,
        variantActive: variant.isActive,
        product: {
          id: variant.product.id,
          name: variant.product.name as LocalizedText,
          status: variant.product.status as ProductStatus,
        },
        levels,
        total,
        needsAttention: variant.isActive && (total.available <= 0 || levels.some((l) => l.isLow)),
      };
    });

    if (query.lowStock) rows = rows.filter((row) => row.needsAttention);
    const start = (query.page - 1) * query.pageSize;
    return {
      items: rows.slice(start, start + query.pageSize),
      page: query.page,
      pageSize: query.pageSize,
      total: rows.length,
    };
  }

  async movements(variantId: string): Promise<StockMovement[]> {
    await this.assertVariant(variantId);
    const rows = await this.inventory.findMovements(variantId, 100);
    const names = await this.inventory.userNames([
      ...new Set(rows.flatMap((r) => (r.actorId ? [r.actorId] : []))),
    ]);
    return rows.map((row) => ({
      id: row.id,
      type: row.type,
      location: {
        id: row.location.id,
        code: row.location.code,
        name: row.location.name as LocalizedText,
      },
      onHandDelta: row.onHandDelta,
      reservedDelta: row.reservedDelta,
      onHandAfter: row.onHandAfter,
      reason: row.reason,
      actorName: row.actorId ? (names.get(row.actorId) ?? null) : null,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  /** Available units per variant across active locations (used by the catalog). */
  availability(variantIds: string[]): Promise<Map<string, number>> {
    return this.inventory.availability(variantIds);
  }

  /** What the storefront shows: in stock, only a few left (≤ 3), or out of stock. */
  static stockStatus(available: number): StockStatus {
    if (available <= 0) return 'out_of_stock';
    return available <= 3 ? 'low_stock' : 'in_stock';
  }

  private async assertVariant(variantId: string): Promise<void> {
    if (!(await this.inventory.variantExists(variantId))) {
      throw invalidField(['variantId'], 'not_found');
    }
  }

  private async assertLocation(locationId: string): Promise<LocationRow> {
    const location = await this.inventory.findLocation(locationId);
    if (!location) throw invalidField(['locationId'], 'not_found');
    return location;
  }
}

function toLocation(row: LocationRow): StockLocation {
  return {
    id: row.id,
    code: row.code,
    name: row.name as LocalizedText,
    address: row.address,
    isDefault: row.isDefault,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
  };
}
