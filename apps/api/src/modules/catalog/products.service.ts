import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  type CategoryAttribute,
  type LocalizedText,
  normalizeArabic,
  type Product,
  type ProductListItem,
  type productInputSchema,
  type productListQuerySchema,
  type ProductStatus,
  specsSchemaFor,
  splitAttributes,
} from '@shop/contracts';
import type { z } from 'zod';
import { type MediaRecord, MediaService } from '../media/index.js';
import { BrandsRepository } from './brands.repository.js';
import { CategoriesRepository } from './categories.repository.js';
import { alreadyExists, invalidField, nestedValidationError } from './errors.js';
import { effectiveAttributes, toProduct, toProductListItem } from './mappers.js';
import { type ImageWrite, ProductsRepository, type VariantWrite } from './products.repository.js';
import { buildSearchText } from './search-text.js';

type ProductInput = z.output<typeof productInputSchema>;
type ProductListQuery = z.output<typeof productListQuerySchema>;

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

@Injectable()
export class ProductsService {
  constructor(
    private readonly products: ProductsRepository,
    private readonly categories: CategoriesRepository,
    private readonly brands: BrandsRepository,
    private readonly media: MediaService,
  ) {}

  /** Public image URLs for a stored image. */
  private readonly asset = (row: MediaRecord) => this.media.toAsset(row);

  async list(query: ProductListQuery): Promise<Paginated<ProductListItem>> {
    let categoryIds: string[] | undefined;
    if (query.categoryId) {
      // A parent category also lists its subcategories' products.
      const children = await this.categories.findChildren(query.categoryId);
      categoryIds = [query.categoryId, ...children.map((c) => c.id)];
    }
    const search = query.q ? normalizeArabic(query.q) : undefined;
    const { rows, total } = await this.products.list(
      { categoryIds, brandId: query.brandId, status: query.status, search: search || undefined },
      query.page,
      query.pageSize,
    );
    return {
      items: rows.map((row) => toProductListItem(row, this.asset)),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  }

  async get(id: string): Promise<Product> {
    return toProduct(await this.findOrThrow(id), this.asset);
  }

  /** New products start as drafts; publishing is a separate permission. */
  async create(input: ProductInput): Promise<Product> {
    const prepared = await this.prepare(input);
    await this.assertAvailable(prepared.product.slug, prepared.variants);
    const row = await this.products.create(prepared.product, prepared.variants, prepared.images);
    return toProduct(row, this.asset);
  }

  async update(id: string, input: ProductInput): Promise<Product> {
    const current = await this.findOrThrow(id);
    const ownIds = new Set(current.variants.map((v) => v.id));
    input.variants.forEach((variant, index) => {
      if (variant.id && !ownIds.has(variant.id)) {
        throw invalidField(['variants', index, 'id'], 'not_found');
      }
    });
    const prepared = await this.prepare(input);
    await this.assertAvailable(prepared.product.slug, prepared.variants, id);
    const row = await this.products.update(
      id,
      prepared.product,
      prepared.variants,
      prepared.images,
    );
    return toProduct(row, this.asset);
  }

  async setStatus(id: string, status: ProductStatus): Promise<Product> {
    const current = await this.findOrThrow(id);
    if (status === 'active' && !current.variants.some((v) => v.isActive)) {
      throw new ConflictException('Activate at least one variant before publishing');
    }
    const publishedAt =
      status === 'active' ? (current.publishedAt ?? new Date()) : current.publishedAt;
    return toProduct(await this.products.setStatus(id, status, publishedAt), this.asset);
  }

  async remove(id: string): Promise<void> {
    await this.findOrThrow(id);
    await this.products.softDelete(id);
  }

  /** Slug and SKUs must be unique; report exactly which field clashes. */
  private async assertAvailable(slug: string, variants: VariantWrite[], productId?: string) {
    const taken = await this.products.findTaken(
      slug,
      variants.map((v) => v.sku),
      productId,
    );
    const paths: (string | number)[][] = [];
    if (taken.slugTaken) paths.push(['slug']);
    variants.forEach((v, index) => {
      if (taken.takenSkus.has(v.sku)) paths.push(['variants', index, 'sku']);
    });
    if (paths.length) throw alreadyExists(paths);
  }

  private async findOrThrow(id: string) {
    const row = await this.products.findById(id);
    if (!row) throw new NotFoundException('Product not found');
    return row;
  }

  /** Validates references and specs against the category template; builds rows to write. */
  private async prepare(input: ProductInput) {
    const category = await this.categories.findById(input.categoryId);
    if (!category) throw invalidField(['categoryId'], 'not_found');
    const parent = category.parentId ? await this.categories.findById(category.parentId) : null;
    const brand = await this.brands.findById(input.brandId);
    if (!brand) throw invalidField(['brandId'], 'not_found');

    const missingImages = await this.media.missingIds(input.images.map((i) => i.mediaId));
    const badImage = input.images.findIndex((i) => missingImages.has(i.mediaId));
    if (badImage >= 0) throw invalidField(['images', badImage, 'mediaId'], 'not_found');

    const { productAttributes, variantAttributes } = splitAttributes<CategoryAttribute>(
      effectiveAttributes(category, parent),
    );

    const specs = specsSchemaFor(productAttributes).safeParse(input.specs);
    if (!specs.success) throw nestedValidationError(['specs'], specs.error.issues);

    const optionsSchema = specsSchemaFor(variantAttributes);
    const variants: VariantWrite[] = input.variants.map((variant, index) => {
      const options = optionsSchema.safeParse(variant.options);
      if (!options.success) {
        throw nestedValidationError(['variants', index, 'options'], options.error.issues);
      }
      return {
        id: variant.id,
        sku: variant.sku.toUpperCase(),
        modelNumber: variant.modelNumber,
        options: options.data,
        price: variant.price,
        salePrice: variant.salePrice,
        saleStartsAt: variant.saleStartsAt ? new Date(variant.saleStartsAt) : null,
        saleEndsAt: variant.saleEndsAt ? new Date(variant.saleEndsAt) : null,
        weightGrams: variant.weightGrams,
        lengthMm: variant.lengthMm,
        widthMm: variant.widthMm,
        heightMm: variant.heightMm,
        barcode: variant.barcode,
        isActive: variant.isActive,
        sortOrder: index, // the list order is the display order
      };
    });

    const images: ImageWrite[] = input.images.map((image) => ({
      mediaId: image.mediaId,
      alt: image.alt,
    }));

    return {
      product: {
        categoryId: input.categoryId,
        brandId: input.brandId,
        slug: input.slug,
        name: input.name,
        shortDescription: input.shortDescription,
        description: input.description,
        specs: specs.data,
        isLargeItem: input.isLargeItem,
        warrantyMonths: input.warrantyMonths,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        searchText: buildSearchText({
          name: input.name,
          brandName: brand.name as LocalizedText,
          categoryName: category.name as LocalizedText,
          variants,
        }),
      },
      variants,
      images,
    };
  }
}
