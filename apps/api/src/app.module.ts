import { Module } from '@nestjs/common';
import { CatalogModule } from './modules/catalog/index.js';
import { HealthModule } from './modules/health/health.module.js';
import { IdentityModule } from './modules/identity/index.js';
import { InventoryModule } from './modules/inventory/index.js';
import { MediaModule } from './modules/media/index.js';
import { ConfigModule } from './shared/config/config.module.js';
import { DatabaseModule } from './shared/database/database.module.js';
import { LoggerModule } from './shared/logger/logger.module.js';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    DatabaseModule,
    IdentityModule,
    HealthModule,
    MediaModule,
    InventoryModule,
    CatalogModule,
  ],
})
export class AppModule {}
