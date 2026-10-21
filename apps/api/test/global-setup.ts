import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import pg from 'pg';

/** Recreates the e2e database from migrations before the suite runs. Requires `pnpm db:up`. */
export default async function setup(): Promise<void> {
  if (existsSync('.env')) process.loadEnvFile('.env');
  const testUrl = process.env.DATABASE_URL_TEST;
  if (!testUrl) throw new Error('DATABASE_URL_TEST is not set (see apps/api/.env.example)');

  const url = new URL(testUrl);
  const database = url.pathname.slice(1);
  if (!/^[a-z0-9_]+_test$/.test(database)) {
    throw new Error(`Refusing to reset "${database}": e2e database names must end in _test`);
  }

  const admin = new pg.Client({
    connectionString: Object.assign(new URL(testUrl), { pathname: '/postgres' }).toString(),
  });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`);
  await admin.query(`CREATE DATABASE "${database}"`);
  await admin.end();

  execSync('pnpm exec prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: testUrl },
    stdio: 'pipe',
  });
}
