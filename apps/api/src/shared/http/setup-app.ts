import { type INestApplication, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { mountAuth } from '../../modules/identity/index.js';
import { mountMedia } from '../../modules/media/index.js';
import { APP_CONFIG, type AppConfig } from '../config/config.js';
import { ProblemDetailsFilter } from './problem-details.filter.js';

/**
 * HTTP setup shared by main.ts and e2e tests, so tests exercise the real configuration.
 * Routes: /api/v1/... (versioned), /api/health (version-neutral), /api/auth/* (Better Auth),
 * /api/docs (OpenAPI).
 */
export function setupApp(app: INestApplication): void {
  const config = app.get<AppConfig>(APP_CONFIG);
  const express = app as NestExpressApplication;

  express.set('trust proxy', config.TRUST_PROXY);
  express.disable('x-powered-by');
  app.use(
    helmet({
      // HTTPS is enforced by Caddy in production (ADR-0014). Helmet's default
      // `upgrade-insecure-requests` made browsers fetch /api/docs assets over https on
      // plain-http hosts (local dev), which broke the docs page.
      contentSecurityPolicy: { directives: { upgradeInsecureRequests: null } },
    }),
  );
  mountAuth(app);
  mountMedia(app, config);
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
