import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Brand, brandInputSchema } from '@shop/contracts';
import type { z } from 'zod';
import { type BrandRow, BrandsRepository } from './brands.repository.js';
import { toBrand } from './mappers.js';

type BrandInput = z.output<typeof brandInputSchema>;

@Injectable()
export class BrandsService {
  constructor(private readonly brands: BrandsRepository) {}

  async list(): Promise<Brand[]> {
    return (await this.brands.findAll()).map(toBrand);
  }

  async get(id: string): Promise<Brand> {
    return toBrand(await this.findOrThrow(id));
  }

  async create(input: BrandInput): Promise<Brand> {
    return toBrand(await this.brands.create(input));
  }

  async update(id: string, input: BrandInput): Promise<Brand> {
    await this.findOrThrow(id);
    return toBrand(await this.brands.update(id, input));
  }

  async remove(id: string): Promise<void> {
    const row = await this.findOrThrow(id);
    if (row._count.products > 0) {
      throw new ConflictException('This brand still has products. Deactivate it instead.');
    }
    await this.brands.delete(id);
  }

  private async findOrThrow(id: string): Promise<BrandRow> {
    const row = await this.brands.findById(id);
    if (!row) throw new NotFoundException('Brand not found');
    return row;
  }
}
