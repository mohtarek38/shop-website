import { Module } from '@nestjs/common';
import { HealthModule } from './modules/health/health.module.js';
import { ConfigModule } from './shared/config/config.module.js';
import { DatabaseModule } from './shared/database/database.module.js';
import { LoggerModule } from './shared/logger/logger.module.js';

@Module({
  imports: [ConfigModule, LoggerModule, DatabaseModule, HealthModule],
})
export class AppModule {}
