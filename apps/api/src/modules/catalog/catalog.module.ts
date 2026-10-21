import { Module } from '@nestjs/common';
import { MediaModule } from '../media/index.js';
import { BrandsAdminController } from './brands.admin.controller.js';
import { BrandsRepository } from './brands.repository.js';
import { BrandsService } from './brands.service.js';
import { CategoriesAdminController } from './categories.admin.controller.js';
import { CategoriesRepository } from './categories.repository.js';
import { CategoriesService } from './categories.service.js';
import { ProductsAdminController } from './products.admin.controller.js';
import { ProductsRepository } from './products.repository.js';
import { ProductsService } from './products.service.js';

@Module({
  imports: [MediaModule],
  controllers: [CategoriesAdminController, BrandsAdminController, ProductsAdminController],
  providers: [
    CategoriesRepository,
    CategoriesService,
    BrandsRepository,
    BrandsService,
    ProductsRepository,
    ProductsService,
  ],
  exports: [CategoriesService, BrandsService, ProductsService],
})
export class CatalogModule {}
