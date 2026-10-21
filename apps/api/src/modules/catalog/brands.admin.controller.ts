import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { type Brand, brandInputSchema } from '@shop/contracts';
import type { z } from 'zod';
import { ZodBody } from '../../shared/http/zod-validation.js';
import { RequirePermission } from '../identity/index.js';
import { BrandsService } from './brands.service.js';

type BrandInput = z.output<typeof brandInputSchema>;

@ApiTags('admin: catalog')
@Controller('admin/brands')
export class BrandsAdminController {
  constructor(private readonly brands: BrandsService) {}

  @Get()
  @RequirePermission('catalog.read')
  list(): Promise<Brand[]> {
    return this.brands.list();
  }

  @Get(':id')
  @RequirePermission('catalog.read')
  get(@Param('id', ParseUUIDPipe) id: string): Promise<Brand> {
    return this.brands.get(id);
  }

  @Post()
  @RequirePermission('catalog.write')
  create(@ZodBody(brandInputSchema) body: BrandInput): Promise<Brand> {
    return this.brands.create(body);
  }

  @Put(':id')
  @RequirePermission('catalog.write')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @ZodBody(brandInputSchema) body: BrandInput,
  ): Promise<Brand> {
    return this.brands.update(id, body);
  }

  @Delete(':id')
  @RequirePermission('catalog.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.brands.remove(id);
  }
}
