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
import { type Category, categoryInputSchema } from '@shop/contracts';
import type { z } from 'zod';
import { ZodBody } from '../../shared/http/zod-validation.js';
import { RequirePermission } from '../identity/index.js';
import { CategoriesService } from './categories.service.js';

type CategoryInput = z.output<typeof categoryInputSchema>;

@ApiTags('admin: catalog')
@Controller('admin/categories')
export class CategoriesAdminController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  @RequirePermission('catalog.read')
  list(): Promise<Category[]> {
    return this.categories.list();
  }

  @Get(':id')
  @RequirePermission('catalog.read')
  get(@Param('id', ParseUUIDPipe) id: string): Promise<Category> {
    return this.categories.get(id);
  }

  @Post()
  @RequirePermission('catalog.write')
  create(@ZodBody(categoryInputSchema) body: CategoryInput): Promise<Category> {
    return this.categories.create(body);
  }

  /** Full replace, including the attribute template. */
  @Put(':id')
  @RequirePermission('catalog.write')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @ZodBody(categoryInputSchema) body: CategoryInput,
  ): Promise<Category> {
    return this.categories.update(id, body);
  }

  @Delete(':id')
  @RequirePermission('catalog.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.categories.remove(id);
  }
}
