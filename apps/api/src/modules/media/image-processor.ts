import sharp, { type Metadata } from 'sharp';

/** Resized WebP sizes generated at upload (ADR-0018): longest side in pixels. */
export const IMAGE_SIZES = { thumb: 200, md: 600, lg: 1200 } as const;
export type ImageSize = keyof typeof IMAGE_SIZES;

export const ACCEPTED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MIN_IMAGE_SIDE = 300;

export class InvalidImageError extends Error {
  constructor(readonly code: 'unsupported_image' | 'image_too_small') {
    super(code);
  }
}

export interface ProcessedImage {
  width: number;
  height: number;
  /** Format sharp detected from the bytes (not the client's claimed type). */
  format: string;
  sizes: Record<ImageSize, Buffer>;
}

/**
 * Validates an upload by decoding it, then produces the WebP sizes. Photos are rotated
 * upright from their EXIF orientation; metadata (e.g. GPS) is not copied to the outputs.
 */
export async function processImage(input: Buffer): Promise<ProcessedImage> {
  let meta: Metadata;
  try {
    meta = await sharp(input).metadata();
  } catch {
    throw new InvalidImageError('unsupported_image');
  }
  const format = meta.format ?? '';
  if (!['jpeg', 'png', 'webp', 'heif'].includes(format) || !meta.width || !meta.height) {
    throw new InvalidImageError('unsupported_image');
  }

  // EXIF orientations 5–8 swap width and height.
  const rotated = (meta.orientation ?? 1) >= 5;
  const width = rotated ? meta.height : meta.width;
  const height = rotated ? meta.width : meta.height;
  if (Math.max(width, height) < MIN_IMAGE_SIDE) throw new InvalidImageError('image_too_small');

  const resize = (side: number) =>
    sharp(input)
      .rotate()
      .resize({ width: side, height: side, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

  const [thumb, md, lg] = await Promise.all([
    resize(IMAGE_SIZES.thumb),
    resize(IMAGE_SIZES.md),
    resize(IMAGE_SIZES.lg),
  ]);
  return { width, height, format, sizes: { thumb, md, lg } };
}
