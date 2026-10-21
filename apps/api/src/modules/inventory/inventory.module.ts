import { Module } from '@nestjs/common';
import { InventoryAdminController } from './inventory.admin.controller.js';
import { InventoryRepository } from './inventory.repository.js';
import { InventoryService } from './inventory.service.js';

@Module({
  controllers: [InventoryAdminController],
  providers: [InventoryRepository, InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
