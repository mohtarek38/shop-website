import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { MediaAsset } from '@shop/contracts';
import { APP_CONFIG, type AppConfig } from '../../shared/config/config.js';
import { RequestValidationException } from '../../shared/http/zod-validation.js';
import {
  ACCEPTED_IMAGE_TYPES,
  IMAGE_SIZES,
  type ImageSize,
  InvalidImageError,
  MAX_IMAGE_BYTES,
  processImage,
} from './image-processor.js';
import { MediaRepository, type MediaRow } from './media.repository.js';
import { STORAGE_PROVIDER, type StorageProvider } from './storage/storage.provider.js';

export interface UploadedFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

/** Rows from other modules that reference media (e.g. product_media → media). */
export type MediaRecord = Pick<MediaRow, 'id' | 'storageKey' | 'variants' | 'width' | 'height'>;

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly media: MediaRepository,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  /** Stores an uploaded product image and its resized WebP versions. */
  async uploadImage(file: UploadedFile | undefined, uploadedById: string): Promise<MediaAsset> {
    if (!file) throw fileError('file_required');
    const extension = ACCEPTED_IMAGE_TYPES[file.mimetype];
    if (!extension) throw fileError('unsupported_image');
    if (file.size > MAX_IMAGE_BYTES) throw fileError('image_too_large');

    let processed;
    try {
      processed = await processImage(file.buffer);
    } catch (error) {
      if (error instanceof InvalidImageError) throw fileError(error.code);
      throw error;
    }

    // One folder per upload: products/<id>/original.jpg, products/<id>/md.webp, …
    const id = randomUUID();
    const folder = `products/${id}`;
    const originalKey = `${folder}/original.${extension}`;
    const variants = Object.fromEntries(
      (Object.keys(IMAGE_SIZES) as ImageSize[]).map((size) => [size, `${folder}/${size}.webp`]),
    ) as Record<ImageSize, string>;

    await this.storage.put('public', originalKey, file.buffer, file.mimetype);
    await Promise.all(
      (Object.keys(variants) as ImageSize[]).map((size) =>
        this.storage.put('public', variants[size], processed.sizes[size], 'image/webp'),
      ),
    );

    const row = await this.media.create({
      bucket: 'public',
      storageKey: originalKey,
      variants,
      mimeType: file.mimetype,
      width: processed.width,
      height: processed.height,
      sizeBytes: file.size,
      originalName: file.originalname.slice(0, 200),
      uploadedById,
    });
    this.logger.log(`Stored image ${row.id} (${processed.width}×${processed.height})`);
    return this.toAsset(row);
  }

  /** Ids from the list that don't exist (for validating references). */
  async missingIds(ids: string[]): Promise<Set<string>> {
    const found = new Set((await this.media.findByIds(ids)).map((row) => row.id));
    return new Set(ids.filter((id) => !found.has(id)));
  }

  /** Public URLs for a stored image. */
  toAsset(row: MediaRecord): MediaAsset {
    const variants = row.variants as Partial<Record<ImageSize, string>>;
    const url = (key: string) => `${this.config.MEDIA_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
    const original = url(row.storageKey);
    return {
      id: row.id,
      width: row.width,
      height: row.height,
      urls: {
        thumb: variants.thumb ? url(variants.thumb) : original,
        md: variants.md ? url(variants.md) : original,
        lg: variants.lg ? url(variants.lg) : original,
        original,
      },
    };
  }
}

function fileError(code: string): RequestValidationException {
  return new RequestValidationException([
    { code: 'custom', path: ['file'], message: code, input: undefined },
  ]);
}
