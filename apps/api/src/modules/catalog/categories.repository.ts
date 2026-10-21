import { Injectable } from '@nestjs/common';
import type { categoryAttributeInputSchema } from '@shop/contracts';
import type { z } from 'zod';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../shared/database/prisma.service.js';

type AttributeInput = z.output<typeof categoryAttributeInputSchema>;

export interface CategoryWrite {
  parentId: string | null;
  slug: string;
  name: Prisma.InputJsonValue;
  description: Prisma.InputJsonValue | null;
  seoTitle: Prisma.InputJsonValue | null;
  seoDescription: Prisma.InputJsonValue | null;
  isActive: boolean;
  sortOrder: number;
}

const categoryInclude = {
  attributes: { orderBy: [{ sortOrder: 'asc' }, { key: 'asc' }] },
  _count: { select: { products: { where: { deletedAt: null } }, children: true } },
} satisfies Prisma.CategoryInclude;

export type CategoryRow = Prisma.CategoryGetPayload<{ include: typeof categoryInclude }>;

/** The only code that queries category tables (ADR-0002). */
@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<CategoryRow[]> {
    return this.prisma.category.findMany({
      include: categoryInclude,
      orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }],
    });
  }

  findById(id: string): Promise<CategoryRow | null> {
    return this.prisma.category.findUnique({ where: { id }, include: categoryInclude });
  }

  findChildren(parentId: string): Promise<CategoryRow[]> {
    return this.prisma.category.findMany({ where: { parentId }, include: categoryInclude });
  }

  /** Creates the category with its own attributes in one transaction. */
  create(data: CategoryWrite, attributes: AttributeInput[]): Promise<CategoryRow> {
    return this.prisma.category.create({
      data: {
        ...withJson(data),
        attributes: { create: attributes.map((attr, index) => attributeData(attr, index)) },
      },
      include: categoryInclude,
    });
  }

  /**
   * Updates the category and replaces its attribute list: existing keys are updated
   * (keeping their ids), new keys created, missing keys removed.
   */
  update(id: string, data: CategoryWrite, attributes: AttributeInput[]): Promise<CategoryRow> {
    return this.prisma.$transaction(async (tx) => {
      await tx.category.update({ where: { id }, data: withJson(data) });
      await tx.categoryAttribute.deleteMany({
        where: { categoryId: id, key: { notIn: attributes.map((a) => a.key) } },
      });
      for (const [index, attr] of attributes.entries()) {
        await tx.categoryAttribute.upsert({
          where: { categoryId_key: { categoryId: id, key: attr.key } },
          create: { categoryId: id, ...attributeData(attr, index) },
          update: attributeData(attr, index),
        });
      }
      return tx.category.findUniqueOrThrow({ where: { id }, include: categoryInclude });
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.category.delete({ where: { id } });
  }
}

function withJson(data: CategoryWrite) {
  return {
    ...data,
    description: data.description ?? Prisma.DbNull,
    seoTitle: data.seoTitle ?? Prisma.DbNull,
    seoDescription: data.seoDescription ?? Prisma.DbNull,
  };
}

/** The list order is the display order. */
function attributeData(attr: AttributeInput, sortOrder: number) {
  return {
    key: attr.key,
    label: attr.label,
    type: attr.type,
    unit: attr.unit ?? Prisma.DbNull,
    options: attr.options,
    isRequired: attr.isRequired,
    isFilterable: attr.isFilterable,
    isComparable: attr.isComparable,
    isVariantOption: attr.isVariantOption,
    sortOrder,
  };
}
