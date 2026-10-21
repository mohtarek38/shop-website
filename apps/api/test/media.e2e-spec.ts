import type { INestApplication } from '@nestjs/common';
import sharp from 'sharp';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import type { Auth } from '../src/modules/identity/auth.js';
import { ensureStaffUser, seedPermissionsAndRoles } from '../src/modules/identity/identity.seed.js';
import { AUTH } from '../src/modules/identity/identity.tokens.js';
import { PrismaService } from '../src/shared/database/prisma.service.js';
import { createTestApp } from './create-test-app.js';

const ORIGIN = 'http://localhost:5173';
const PASSWORD = 'media-staff-12345';

const png = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: '#F5B731' } })
    .png()
    .toBuffer();

describe('Media and product images (e2e)', () => {
  let app: INestApplication<App>;
  let editor: ReturnType<typeof request.agent>;
  let clerk: ReturnType<typeof request.agent>;
  let categoryId: string;
  let brandId: string;

  async function signIn(email: string) {
    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/api/auth/sign-in/email')
      .set('Origin', ORIGIN)
      .send({ email, password: PASSWORD })
      .expect(200);
    return agent;
  }

  beforeAll(async () => {
    app = await createTestApp();
    const prisma = app.get(PrismaService);
    const auth = app.get<Auth>(AUTH);
    await seedPermissionsAndRoles(prisma);
    for (const [email, role] of [
      ['media-editor@test.local', 'catalog_editor'],
      ['media-clerk@test.local', 'clerk'],
    ] as const) {
      await ensureStaffUser(prisma, auth, { name: role, email, password: PASSWORD, roles: [role] });
    }
    editor = await signIn('media-editor@test.local');
    clerk = await signIn('media-clerk@test.local');

    categoryId = (
      await editor
        .post('/api/v1/admin/categories')
        .send({ slug: 'media-test-cat', name: { ar: 'قسم الصور' } })
        .expect(201)
    ).body.id;
    brandId = (
      await editor
        .post('/api/v1/admin/brands')
        .send({ slug: 'media-test-brand', name: { ar: 'ماركة الصور' } })
        .expect(201)
    ).body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  const upload = async (agent: typeof editor, body: Buffer, filename: string, type: string) =>
    agent.post('/api/v1/admin/media/images').attach('file', body, { filename, contentType: type });

  it('stores an image with resized WebP versions served from MEDIA_PUBLIC_URL', async () => {
    const res = await upload(editor, await png(1600, 1200), 'fridge.png', 'image/png');
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ width: 1600, height: 1200 });
    expect(res.body.urls.md).toMatch(/^\/api\/media\/files\/products\/.+\/md\.webp$/);

    const file = await request(app.getHttpServer()).get(res.body.urls.md).expect(200);
    expect(file.headers['content-type']).toBe('image/webp');
    expect(file.headers['cache-control']).toMatch(/immutable/);
    expect((await sharp(file.body).metadata()).width).toBe(600);
  });

  it('rejects files that are not images, too small, or missing', async () => {
    const fake = await upload(editor, Buffer.from('not an image'), 'x.png', 'image/png');
    expect(fake.status).toBe(400);
    expect(fake.body.errors[0]).toMatchObject({ path: 'file', message: 'unsupported_image' });

    const svg = await upload(editor, Buffer.from('<svg/>'), 'x.svg', 'image/svg+xml');
    expect(svg.body.errors[0].message).toBe('unsupported_image');

    const tiny = await upload(editor, await png(120, 80), 'tiny.png', 'image/png');
    expect(tiny.body.errors[0].message).toBe('image_too_small');

    const none = await editor.post('/api/v1/admin/media/images').expect(400);
    expect(none.body.errors[0].message).toBe('file_required');
  });

  it('lets only catalog writers upload', async () => {
    const res = await upload(clerk, await png(400, 400), 'a.png', 'image/png');
    expect(res.status).toBe(403);
  });

  it('attaches images to products in order and lists the main thumbnail', async () => {
    const first = (await upload(editor, await png(800, 800), 'a.png', 'image/png')).body;
    const second = (await upload(editor, await png(900, 600), 'b.png', 'image/png')).body;

    const product = {
      categoryId,
      brandId,
      slug: 'media-test-product',
      name: { ar: 'منتج بالصور' },
      images: [{ mediaId: second.id }, { mediaId: first.id, alt: { ar: 'صورة جانبية' } }],
      variants: [{ sku: 'MEDIA-1', price: 10_000 }],
    };
    const created = await editor.post('/api/v1/admin/products').send(product).expect(201);
    expect(created.body.images.map((i: { id: string }) => i.id)).toEqual([second.id, first.id]);
    expect(created.body.images[1].alt).toEqual({ ar: 'صورة جانبية' });

    // Reorder and drop one.
    const updated = await editor
      .put(`/api/v1/admin/products/${created.body.id}`)
      .send({ ...product, images: [{ mediaId: first.id }] })
      .expect(200);
    expect(updated.body.images.map((i: { id: string }) => i.id)).toEqual([first.id]);

    const list = await editor.get('/api/v1/admin/products').query({ q: 'MEDIA-1' }).expect(200);
    expect(list.body.items[0].thumbnail).toBe(first.urls.thumb);
  });

  it('rejects unknown image ids at their position', async () => {
    const res = await editor
      .post('/api/v1/admin/products')
      .send({
        categoryId,
        brandId,
        slug: 'media-bad-ref',
        name: { ar: 'مرجع خاطئ' },
        images: [{ mediaId: '01a15fae-6fdf-75ea-806a-000000000000' }],
        variants: [{ sku: 'MEDIA-2', price: 10_000 }],
      })
      .expect(400);
    expect(res.body.errors[0]).toMatchObject({ path: 'images.0.mediaId', message: 'not_found' });
  });
});
