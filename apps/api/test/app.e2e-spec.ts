import { Controller, type INestApplication, Post } from '@nestjs/common';
import { z } from 'zod';
import request from 'supertest';
import { Public } from '../src/modules/identity/index.js';
import { ZodBody } from '../src/shared/http/zod-validation.js';
import { createTestApp } from './create-test-app.js';

// Environment comes from test/setup-env.ts (.env locally, workflow env in CI).

const echoSchema = z.object({ quantity: z.number().int().positive() });

@Public()
@Controller('echo')
class EchoController {
  @Post()
  echo(@ZodBody(echoSchema) body: z.infer<typeof echoSchema>) {
    return body;
  }
}

describe('API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp([EchoController]);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health reports the database as up', async () => {
    const res = await request(app.getHttpServer()).get('/api/health').expect(200);
    expect(res.body).toMatchObject({ status: 'ok', database: 'up' });
  });

  it('unknown routes return RFC 9457 problem details', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/does-not-exist').expect(404);
    expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
    expect(res.body).toMatchObject({
      title: 'Not Found',
      status: 404,
      instance: '/api/v1/does-not-exist',
    });
  });

  it('validates bodies with shared Zod schemas on versioned routes', async () => {
    await request(app.getHttpServer()).post('/api/v1/echo').send({ quantity: 2 }).expect(201, {
      quantity: 2,
    });

    const res = await request(app.getHttpServer())
      .post('/api/v1/echo')
      .send({ quantity: -1 })
      .expect(400);
    expect(res.body.type).toMatch(/validation$/);
    expect(res.body.errors).toEqual([
      expect.objectContaining({ path: 'quantity', code: 'too_small' }),
    ]);
  });

  it('sets security headers without forcing HTTPS sub-resources', async () => {
    const res = await request(app.getHttpServer()).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
    // HTTPS is enforced by Caddy in production; this directive broke /api/docs on http.
    expect(res.headers['content-security-policy']).not.toContain('upgrade-insecure-requests');
  });

  it('serves the OpenAPI docs page and its assets', async () => {
    const page = await request(app.getHttpServer()).get('/api/docs').expect(200);
    expect(page.text).toContain('swagger-ui-bundle.js');
    await request(app.getHttpServer()).get('/api/docs/swagger-ui-bundle.js').expect(200);
    const spec = await request(app.getHttpServer()).get('/api/docs-json').expect(200);
    expect(Object.keys(spec.body.paths)).toContain('/api/v1/me');
  });
});
