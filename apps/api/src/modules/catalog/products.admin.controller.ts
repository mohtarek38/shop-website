import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  type Product,
  type ProductListItem,
  productInputSchema,
  productListQuerySchema,
  productStatusInputSchema,
} from '@shop/contracts';
import type { z } from 'zod';
import { ZodBody, ZodQuery } from '../../shared/http/zod-validation.js';
import { RequirePermission } from '../identity/index.js';
import { type Paginated, ProductsService } from './products.service.js';

type ProductInput = z.output<typeof productInputSchema>;

@ApiTags('admin: catalog')
@Controller('admin/products')
export class ProductsAdminController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @RequirePermission('catalog.read')
  list(
    @ZodQuery(productListQuerySchema) query: z.output<typeof productListQuerySchema>,
  ): Promise<Paginated<ProductListItem>> {
    return this.products.list(query);
  }

  @Get(':id')
  @RequirePermission('catalog.read')
  get(@Param('id', ParseUUIDPipe) id: string): Promise<Product> {
    return this.products.get(id);
  }

  /** Creates a draft. */
  @Post()
  @RequirePermission('catalog.write')
  create(@ZodBody(productInputSchema) body: ProductInput): Promise<Product> {
    return this.products.create(body);
  }

  /** Full replace, including variants (send each existing variant's id to keep it). */
  @Put(':id')
  @RequirePermission('catalog.write')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @ZodBody(productInputSchema) body: ProductInput,
  ): Promise<Product> {
    return this.products.update(id, body);
  }

  /** Publish (active), unpublish (draft) or archive. */
  @Patch(':id/status')
  @RequirePermission('catalog.publish')
  setStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @ZodBody(productStatusInputSchema) body: z.output<typeof productStatusInputSchema>,
  ): Promise<Product> {
    return this.products.setStatus(id, body.status);
  }

  @Delete(':id')
  @RequirePermission('catalog.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.products.remove(id);
  }
}
