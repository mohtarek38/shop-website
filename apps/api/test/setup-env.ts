import { existsSync } from 'node:fs';

// Runs before each e2e file: point the app at the disposable test database.
if (existsSync('.env')) process.loadEnvFile('.env');
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
