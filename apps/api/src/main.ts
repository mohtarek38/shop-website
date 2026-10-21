import 'reflect-metadata';
import { existsSync } from 'node:fs';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import { APP_CONFIG, type AppConfig } from './shared/config/config.js';
import { setupApp } from './shared/http/setup-app.js';

// Local development reads apps/api/.env; production gets real environment variables.
if (existsSync('.env')) process.loadEnvFile('.env');

const app = await NestFactory.create(AppModule, { bufferLogs: true });
app.useLogger(app.get(Logger));
setupApp(app);

const config = app.get<AppConfig>(APP_CONFIG);
await app.listen(config.PORT);
app.get(Logger).log(`API listening on http://localhost:${config.PORT}/api`, 'Bootstrap');
