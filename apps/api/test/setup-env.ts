import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Runs before each e2e file: point the app at the disposable test database.
if (existsSync('.env')) process.loadEnvFile('.env');
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
// Uploads go to a throwaway folder, never the dev .storage/.
process.env.STORAGE_DRIVER = 'local';
process.env.LOCAL_STORAGE_DIR = join(tmpdir(), 'shop-e2e-storage');
process.env.MEDIA_PUBLIC_URL = '/api/media/files';
