import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Category, CategoryAttribute, categoryInputSchema } from '@shop/contracts';
import type { z } from 'zod';
import { CategoriesRepository, type CategoryRow } from './categories.repository.js';
import { invalidField } from './errors.js';
import { effectiveAttributes, toCategory } from './mappers.js';

type CategoryInput = z.output<typeof categoryInputSchema>;

/**
 * Categories form a tree at most two levels deep (Kitchen → Refrigerators), so a child
 * inherits exactly one parent's spec template.
 */
@Injectable()
export class CategoriesService {
  constructor(private readonly categories: CategoriesRepository) {}

  async list(): Promise<Category[]> {
    const rows = await this.categories.findAll();
    const byId = new Map(rows.map((r) => [r.id, r]));
    return rows.map((row) =>
      toCategory(row, row.parentId ? (byId.get(row.parentId) ?? null) : null),
    );
  }

  async get(id: string): Promise<Category> {
    const row = await this.findOrThrow(id);
    return toCategory(row, await this.parentOf(row));
  }

  /** Parent's attributes + own: what a product in this category must fill in. */
  async effectiveAttributes(id: string): Promise<CategoryAttribute[]> {
    const row = await this.findOrThrow(id);
    return effectiveAttributes(row, await this.parentOf(row));
  }

  async create(input: CategoryInput): Promise<Category> {
    const parent = await this.validateParent(null, input.parentId);
    this.assertNoKeyClash(input.attributes, parent?.attributes ?? []);
    const row = await this.categories.create(this.toWrite(input), input.attributes);
    return toCategory(row, parent);
  }

  async update(id: string, input: CategoryInput): Promise<Category> {
    const current = await this.findOrThrow(id);
    const parent = await this.validateParent(current, input.parentId);
    this.assertNoKeyClash(input.attributes, parent?.attributes ?? []);
    // Children inherit these attributes, so their own keys mustn't clash either.
    for (const child of await this.categories.findChildren(id)) {
      this.assertNoKeyClash(child.attributes, input.attributes, `child "${child.slug}"`);
    }
    const row = await this.categories.update(id, this.toWrite(input), input.attributes);
    return toCategory(row, parent);
  }

  async remove(id: string): Promise<void> {
    const row = await this.findOrThrow(id);
    if (row._count.children > 0) {
      throw new ConflictException('Move or delete its subcategories first');
    }
    if (row._count.products > 0) {
      throw new ConflictException('Move or delete its products first');
    }
    await this.categories.delete(id);
  }

  private async findOrThrow(id: string): Promise<CategoryRow> {
    const row = await this.categories.findById(id);
    if (!row) throw new NotFoundException('Category not found');
    return row;
  }

  private async parentOf(row: CategoryRow): Promise<CategoryRow | null> {
    return row.parentId ? this.categories.findById(row.parentId) : null;
  }

  /** Enforces the two-level tree. `current` is null when creating. */
  private async validateParent(
    current: CategoryRow | null,
    parentId: string | null,
  ): Promise<CategoryRow | null> {
    if (!parentId) return null;
    if (current && parentId === current.id) {
      throw invalidField(['parentId'], 'cannot_be_own_parent');
    }
    const parent = await this.categories.findById(parentId);
    if (!parent) throw invalidField(['parentId'], 'not_found');
    if (parent.parentId) throw invalidField(['parentId'], 'max_two_levels');
    if (current && current._count.children > 0) {
      throw invalidField(['parentId'], 'has_subcategories');
    }
    return parent;
  }

  private assertNoKeyClash(
    own: { key: string }[],
    inherited: { key: string }[],
    where = 'parent category',
  ): void {
    const inheritedKeys = new Set(inherited.map((a) => a.key));
    const clash = own.find((a) => inheritedKeys.has(a.key));
    if (clash) {
      throw new ConflictException(`Attribute "${clash.key}" is already defined by the ${where}`);
    }
  }

  private toWrite(input: CategoryInput) {
    return {
      parentId: input.parentId,
      slug: input.slug,
      name: input.name,
      description: input.description,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      isActive: input.isActive,
      sortOrder: input.sortOrder,
    };
  }
}
