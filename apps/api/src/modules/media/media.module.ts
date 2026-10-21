import { Module } from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '../../shared/config/config.js';
import { MediaAdminController } from './media.admin.controller.js';
import { MediaRepository } from './media.repository.js';
import { MediaService } from './media.service.js';
import { LocalStorage } from './storage/local-storage.js';
import { R2Storage } from './storage/r2-storage.js';
import { STORAGE_PROVIDER, type StorageProvider } from './storage/storage.provider.js';

/** Picks the storage adapter from STORAGE_DRIVER (ADR-0018). */
function createStorage(config: AppConfig): StorageProvider {
  if (config.STORAGE_DRIVER === 'r2') {
    return new R2Storage({
      accountId: config.R2_ACCOUNT_ID!,
      accessKeyId: config.R2_ACCESS_KEY_ID!,
      secretAccessKey: config.R2_SECRET_ACCESS_KEY!,
      buckets: { public: config.R2_PUBLIC_BUCKET!, private: config.R2_PRIVATE_BUCKET! },
    });
  }
  return new LocalStorage(config.LOCAL_STORAGE_DIR);
}

@Module({
  controllers: [MediaAdminController],
  providers: [
    MediaRepository,
    MediaService,
    { provide: STORAGE_PROVIDER, inject: [APP_CONFIG], useFactory: createStorage },
  ],
  exports: [MediaService, STORAGE_PROVIDER],
})
export class MediaModule {}
