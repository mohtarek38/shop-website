import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { Bucket, StorageProvider } from './storage.provider.js';

export interface R2Options {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  buckets: Record<Bucket, string>;
}

/** Production storage: Cloudflare R2 through its S3-compatible API (ADR-0014, ADR-0018). */
export class R2Storage implements StorageProvider {
  private readonly client: S3Client;

  constructor(private readonly options: R2Options) {
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${options.accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: options.accessKeyId, secretAccessKey: options.secretAccessKey },
    });
  }

  async put(bucket: Bucket, key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.options.buckets[bucket],
        Key: key,
        Body: body,
        ContentType: contentType,
        // Keys are unique per upload, so public files can be cached forever.
        CacheControl: bucket === 'public' ? 'public, max-age=31536000, immutable' : 'private',
      }),
    );
  }

  async delete(bucket: Bucket, key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.options.buckets[bucket], Key: key }),
    );
  }
}
