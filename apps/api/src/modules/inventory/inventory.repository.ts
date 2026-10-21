import { Injectable } from '@nestjs/common';
import type { StockMovementType } from '@shop/contracts';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../shared/database/prisma.service.js';

type Tx = Prisma.TransactionClient;

export interface LevelSnapshot {
  onHand: number;
  reserved: number;
}

export interface MovementMeta {
  reason?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  actorId?: string | null;
}

/** What a stock change does to a level, decided from the locked current values. */
export type StockChange = (current: LevelSnapshot) => {
  type: StockMovementType;
  onHandDelta: number;
  reservedDelta?: number;
};

export type LocationRow = Prisma.StockLocationGetPayload<object>;

/**
 * The only code that writes inventory tables (ADR-0002, ADR-0013). Reads of variant and
 * product names for the stock list are read-only joins (like the reports module).
 */
@Injectable()
export class InventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Locations ───────────────────────────────────────────────────────────

  findLocations(): Promise<LocationRow[]> {
    return this.prisma.stockLocation.findMany({ orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }] });
  }

  findLocation(id: string): Promise<LocationRow | null> {
    return this.prisma.stockLocation.findUnique({ where: { id } });
  }

  async isCodeTaken(code: string, excludeId?: string): Promise<boolean> {
    const owner = await this.prisma.stockLocation.findFirst({
      where: { code, id: excludeId ? { not: excludeId } : undefined },
      select: { id: true },
    });
    return Boolean(owner);
  }

  /** Saves a location; making it the default clears the flag on the others first. */
  saveLocation(
    id: string | null,
    data: Omit<Prisma.StockLocationUncheckedCreateInput, 'id'>,
  ): Promise<LocationRow> {
    return this.prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.stockLocation.updateMany({
          where: { isDefault: true, id: id ? { not: id } : undefined },
          data: { isDefault: false },
        });
      }
      return id
        ? tx.stockLocation.update({ where: { id }, data })
        : tx.stockLocation.create({ data });
    });
  }

  // ─── Stock changes ───────────────────────────────────────────────────────

  /**
   * Applies stock changes atomically. Each level row is created if missing, then locked
   * (SELECT … FOR UPDATE) so concurrent changes queue instead of overwriting each other.
   * Every change writes a ledger row with the resulting on-hand.
   */
  async applyChanges(
    changes: { variantId: string; locationId: string; change: StockChange }[],
    meta: MovementMeta,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const { variantId, locationId, change } of changes) {
        const current = await this.lockLevel(tx, variantId, locationId);
        const { type, onHandDelta, reservedDelta = 0 } = change(current);
        const onHand = current.onHand + onHandDelta;
        const reserved = current.reserved + reservedDelta;
        await tx.stockLevel.update({
          where: { variantId_locationId: { variantId, locationId } },
          data: { onHand, reserved },
        });
        await tx.stockMovement.create({
          data: {
            variantId,
            locationId,
            type,
            onHandDelta,
            reservedDelta,
            onHandAfter: onHand,
            reason: meta.reason ?? null,
            referenceType: meta.referenceType ?? null,
            referenceId: meta.referenceId ?? null,
            actorId: meta.actorId ?? null,
          },
        });
      }
    });
  }

  private async lockLevel(tx: Tx, variantId: string, locationId: string): Promise<LevelSnapshot> {
    await tx.$executeRaw`
      INSERT INTO "stock_level" ("variant_id", "location_id", "on_hand", "reserved", "updated_at")
      VALUES (${variantId}::uuid, ${locationId}::uuid, 0, 0, now())
      ON CONFLICT DO NOTHING`;
    const [row] = await tx.$queryRaw<{ on_hand: number; reserved: number }[]>`
      SELECT "on_hand", "reserved" FROM "stock_level"
      WHERE "variant_id" = ${variantId}::uuid AND "location_id" = ${locationId}::uuid
      FOR UPDATE`;
    return { onHand: row!.on_hand, reserved: row!.reserved };
  }

  async setThreshold(
    variantId: string,
    locationId: string,
    lowStockThreshold: number | null,
  ): Promise<void> {
    await this.prisma.stockLevel.upsert({
      where: { variantId_locationId: { variantId, locationId } },
      create: { variantId, locationId, lowStockThreshold },
      update: { lowStockThreshold },
    });
  }

  // ─── Reads ───────────────────────────────────────────────────────────────

  async variantExists(variantId: string): Promise<boolean> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { id: true },
    });
    return Boolean(variant);
  }

  /** Variants (of non-deleted products) with their stock levels, for the stock list. */
  findVariantsWithStock(search: string[]) {
    return this.prisma.productVariant.findMany({
      where: {
        product: { deletedAt: null },
        AND: search.map((word) => ({
          OR: [
            { product: { searchText: { contains: word } } },
            { sku: { contains: word, mode: 'insensitive' as const } },
          ],
        })),
      },
      select: {
        id: true,
        sku: true,
        options: true,
        isActive: true,
        product: { select: { id: true, name: true, status: true } },
        stockLevels: {
          select: { locationId: true, onHand: true, reserved: true, lowStockThreshold: true },
        },
      },
      orderBy: [{ product: { updatedAt: 'desc' } }, { sortOrder: 'asc' }],
    });
  }

  findMovements(variantId: string, take: number) {
    return this.prisma.stockMovement.findMany({
      where: { variantId },
      orderBy: { createdAt: 'desc' },
      take,
      include: { location: { select: { id: true, code: true, name: true } } },
    });
  }

  async userNames(ids: string[]): Promise<Map<string, string>> {
    if (!ids.length) return new Map();
    const users = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });
    return new Map(users.map((u) => [u.id, u.name]));
  }

  /** Available stock (on hand − reserved) per variant, summed over active locations. */
  async availability(variantIds: string[]): Promise<Map<string, number>> {
    if (!variantIds.length) return new Map();
    const rows = await this.prisma.stockLevel.findMany({
      where: { variantId: { in: variantIds }, location: { isActive: true } },
      select: { variantId: true, onHand: true, reserved: true },
    });
    const totals = new Map<string, number>(variantIds.map((id) => [id, 0]));
    for (const row of rows) {
      totals.set(row.variantId, (totals.get(row.variantId) ?? 0) + row.onHand - row.reserved);
    }
    return totals;
  }
}
