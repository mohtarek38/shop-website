import { type INestApplication, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { APP_CONFIG, type AppConfig } from '../config/config.js';
import { ProblemDetailsFilter } from './problem-details.filter.js';

/**
 * HTTP setup shared by main.ts and e2e tests, so tests exercise the real configuration.
 * Routes: /api/v1/... (versioned), /api/health (version-neutral), /api/docs (OpenAPI).
 */
export function setupApp(app: INestApplication): void {
  const config = app.get<AppConfig>(APP_CONFIG);
  const express = app as NestExpressApplication;

  express.set('trust proxy', config.TRUST_PROXY);
  express.disable('x-powered-by');
  app.use(helmet());
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalFilters(new ProblemDetailsFilter());
  app.enableShutdownHooks();

  if (config.SWAGGER_ENABLED) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Shop API').setVersion(config.APP_VERSION).build(),
    );
    SwaggerModule.setup('api/docs', app, document);
  }
}
