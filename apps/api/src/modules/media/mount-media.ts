import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import express from 'express';
import type { AppConfig } from '../../shared/config/config.js';
import { LocalStorage } from './storage/local-storage.js';
import { STORAGE_PROVIDER } from './storage/storage.provider.js';

/**
 * With the local driver, serves the public bucket at MEDIA_PUBLIC_URL (e.g.
 * /api/media/files). In production R2 + Cloudflare serve images, so this does nothing.
 */
export function mountMedia(app: INestApplication, config: AppConfig): void {
  const storage = app.get(STORAGE_PROVIDER);
  if (!(storage instanceof LocalStorage) || !config.MEDIA_PUBLIC_URL.startsWith('/')) return;

  (app as NestExpressApplication).use(
    config.MEDIA_PUBLIC_URL,
    express.static(storage.bucketDir('public'), {
      // Every upload gets new keys, so files never change.
      immutable: true,
      maxAge: '365d',
      index: false,
      fallthrough: false,
    }),
  );
}
