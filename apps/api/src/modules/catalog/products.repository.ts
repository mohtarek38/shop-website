import { Injectable } from '@nestjs/common';
import type { ProductStatus } from '@shop/contracts';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../shared/database/prisma.service.js';

const mediaSelect = {
  select: { id: true, storageKey: true, variants: true, width: true, height: true },
} as const;

const productInclude = {
  category: { select: { id: true, slug: true, name: true } },
  brand: { select: { id: true, slug: true, name: true } },
  variants: { orderBy: [{ sortOrder: 'asc' }, { sku: 'asc' }] },
  images: { orderBy: { sortOrder: 'asc' }, include: { media: mediaSelect } },
} satisfies Prisma.ProductInclude;

const listInclude = {
  category: { select: { id: true, name: true } },
  brand: { select: { id: true, name: true } },
  images: { orderBy: { sortOrder: 'asc' }, take: 1, include: { media: mediaSelect } },
  variants: {
    select: { price: true, salePrice: true, saleStartsAt: true, saleEndsAt: true, isActive: true },
  },
} satisfies Prisma.ProductInclude;

export type ProductRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>;
export type ProductListRow = Prisma.ProductGetPayload<{ include: typeof listInclude }>;
export type VariantRow = ProductRow['variants'][number];

export interface ProductWrite {
  categoryId: string;
  brandId: string;
  slug: string;
  name: Prisma.InputJsonValue;
  shortDescription: Prisma.InputJsonValue | null;
  description: Prisma.InputJsonValue | null;
  specs: Prisma.InputJsonValue;
  isLargeItem: boolean;
  warrantyMonths: number | null;
  seoTitle: Prisma.InputJsonValue | null;
  seoDescription: Prisma.InputJsonValue | null;
  searchText: string;
}

export interface ImageWrite {
  mediaId: string;
  alt: Prisma.InputJsonValue | null;
}

export interface VariantWrite {
  id?: string;
  sku: string;
  modelNumber: string | null;
  options: Prisma.InputJsonValue;
  price: number;
  salePrice: number | null;
  saleStartsAt: Date | null;
  saleEndsAt: Date | null;
  weightGrams: number | null;
  lengthMm: number | null;
  widthMm: number | null;
  heightMm: number | null;
  barcode: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface ProductFilter {
  categoryIds?: string[];
  brandId?: string;
  status?: ProductStatus;
  /** Already normalized (normalizeArabic). */
  search?: string;
}

/** The only code that queries product tables (ADR-0002). Soft-deleted products are invisible. */
@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<ProductRow | null> {
    return this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: productInclude,
    });
  }

  async list(
    filter: ProductFilter,
    page: number,
    pageSize: number,
  ): Promise<{ rows: ProductListRow[]; total: number }> {
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      status: filter.status,
      brandId: filter.brandId,
      categoryId: filter.categoryIds ? { in: filter.categoryIds } : undefined,
      AND: filter.search
        ? filter.search.split(' ').map((word) => ({ searchText: { contains: word } }))
        : undefined,
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: listInclude,
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.product.count({ where }),
    ]);
    return { rows, total };
  }

  /** Which of these identifiers already belong to another (non-deleted or deleted) product. */
  async findTaken(
    slug: string,
    skus: string[],
    excludeProductId?: string,
  ): Promise<{ slugTaken: boolean; takenSkus: Set<string> }> {
    const notThis = excludeProductId ? { not: excludeProductId } : undefined;
    const [slugOwner, variants] = await Promise.all([
      this.prisma.product.findFirst({ where: { slug, id: notThis }, select: { id: true } }),
      this.prisma.productVariant.findMany({
        where: { sku: { in: skus }, productId: notThis },
        select: { sku: true },
      }),
    ]);
    return { slugTaken: Boolean(slugOwner), takenSkus: new Set(variants.map((v) => v.sku)) };
  }

  create(data: ProductWrite, variants: VariantWrite[], images: ImageWrite[]): Promise<ProductRow> {
    return this.prisma.product.create({
      data: {
        ...withJson(data),
        variants: { create: variants.map(({ id: _id, ...v }) => v) },
        images: { create: images.map(imageData) },
      },
      include: productInclude,
    });
  }

  /**
   * Updates the product, replaces its image list, and syncs variants: update by id,
   * create new, delete missing.
   */
  update(
    id: string,
    data: ProductWrite,
    variants: VariantWrite[],
    images: ImageWrite[],
  ): Promise<ProductRow> {
    const keepIds = variants.flatMap((v) => (v.id ? [v.id] : []));
    return this.prisma.$transaction(async (tx) => {
      await tx.product.update({ where: { id }, data: withJson(data) });
      await tx.productMedia.deleteMany({ where: { productId: id } });
      await tx.productMedia.createMany({
        data: images.map((image, index) => ({ ...imageData(image, index), productId: id })),
      });
      // Phase 3: variants referenced by orders must be deactivated instead of deleted.
      await tx.productVariant.deleteMany({ where: { productId: id, id: { notIn: keepIds } } });
      for (const { id: variantId, ...variant } of variants) {
        if (variantId) {
          await tx.productVariant.update({ where: { id: variantId }, data: variant });
        } else {
          await tx.productVariant.create({ data: { ...variant, productId: id } });
        }
      }
      return tx.product.findUniqueOrThrow({ where: { id }, include: productInclude });
    });
  }

  setStatus(id: string, status: ProductStatus, publishedAt: Date | null): Promise<ProductRow> {
    return this.prisma.product.update({
      where: { id },
      data: { status, publishedAt },
      include: productInclude,
    });
  }

  /**
   * Soft delete. The slug and SKUs get a suffix so they can be reused by a new product,
   * while past orders (Phase 3) keep pointing at the old rows.
   */
  async softDelete(id: string): Promise<void> {
    const suffix = `--deleted-${Date.now().toString(36)}`;
    await this.prisma.$transaction([
      this.prisma.$executeRaw`
        UPDATE "product_variant" SET "sku" = "sku" || ${suffix}, "is_active" = false
        WHERE "product_id" = ${id}::uuid`,
      this.prisma.$executeRaw`
        UPDATE "product" SET "slug" = "slug" || ${suffix}, "status" = 'archived',
          "deleted_at" = now(), "updated_at" = now()
        WHERE "id" = ${id}::uuid`,
    ]);
  }
}

/** The list order is the display order; the first image is the main one. */
function imageData(image: ImageWrite, sortOrder: number) {
  return { mediaId: image.mediaId, alt: image.alt ?? Prisma.DbNull, sortOrder };
}

function withJson(data: ProductWrite) {
  return {
    ...data,
    shortDescription: data.shortDescription ?? Prisma.DbNull,
    description: data.description ?? Prisma.DbNull,
    seoTitle: data.seoTitle ?? Prisma.DbNull,
    seoDescription: data.seoDescription ?? Prisma.DbNull,
  };
}
