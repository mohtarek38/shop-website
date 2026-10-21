export type Bucket = 'public' | 'private';

/**
 * Where uploaded files live (ADR-0018). Swapping local disk for R2 (or anything
 * S3-compatible) is a new adapter; nothing else changes.
 */
export interface StorageProvider {
  put(bucket: Bucket, key: string, body: Buffer, contentType: string): Promise<void>;
  delete(bucket: Bucket, key: string): Promise<void>;
}

export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');
