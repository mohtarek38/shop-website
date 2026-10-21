import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../shared/database/prisma.service.js';

const brandInclude = {
  _count: { select: { products: { where: { deletedAt: null } } } },
} satisfies Prisma.BrandInclude;

export type BrandRow = Prisma.BrandGetPayload<{ include: typeof brandInclude }>;

export interface BrandWrite {
  slug: string;
  name: Prisma.InputJsonValue;
  isActive: boolean;
  sortOrder: number;
}

/** The only code that queries the brand table (ADR-0002). */
@Injectable()
export class BrandsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<BrandRow[]> {
    return this.prisma.brand.findMany({
      include: brandInclude,
      orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }],
    });
  }

  findById(id: string): Promise<BrandRow | null> {
    return this.prisma.brand.findUnique({ where: { id }, include: brandInclude });
  }

  create(data: BrandWrite): Promise<BrandRow> {
    return this.prisma.brand.create({ data, include: brandInclude });
  }

  update(id: string, data: BrandWrite): Promise<BrandRow> {
    return this.prisma.brand.update({ where: { id }, data, include: brandInclude });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.brand.delete({ where: { id } });
  }
}
