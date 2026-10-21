import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import type { Auth } from '../src/modules/identity/auth.js';
import { ensureStaffUser, seedPermissionsAndRoles } from '../src/modules/identity/identity.seed.js';
import { AUTH } from '../src/modules/identity/identity.tokens.js';
import { PrismaService } from '../src/shared/database/prisma.service.js';
import { createTestApp } from './create-test-app.js';

const ORIGIN = 'http://localhost:5173';
const PASSWORD = 'catalog-staff-123';

describe('Catalog admin (e2e)', () => {
  let app: INestApplication<App>;
  let editor: ReturnType<typeof request.agent>;
  let clerk: ReturnType<typeof request.agent>;
  const ids: Record<string, string> = {};

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
      ['catalog-editor@test.local', 'catalog_editor'],
      ['catalog-clerk@test.local', 'clerk'],
    ] as const) {
      await ensureStaffUser(prisma, auth, { name: role, email, password: PASSWORD, roles: [role] });
    }
    editor = await signIn('catalog-editor@test.local');
    clerk = await signIn('catalog-clerk@test.local');
  });

  afterAll(async () => {
    await app.close();
  });

  const fridgeAttributes = [
    {
      key: 'capacity_liters',
      label: { ar: 'السعة', en: 'Capacity' },
      type: 'number',
      unit: { ar: 'لتر', en: 'L' },
      isRequired: true,
      isFilterable: true,
    },
    { key: 'no_frost', label: { ar: 'نوفروست', en: 'No Frost' }, type: 'boolean' },
    {
      key: 'color',
      label: { ar: 'اللون', en: 'Color' },
      type: 'enum',
      isVariantOption: true,
      options: [
        { value: 'silver', label: { ar: 'فضي', en: 'Silver' } },
        { value: 'black', label: { ar: 'أسود', en: 'Black' } },
      ],
    },
  ];

  const product = (overrides: Record<string, unknown> = {}) => ({
    categoryId: ids.fridges,
    brandId: ids.samsung,
    slug: 'samsung-rt38',
    name: { ar: 'ثلاجة سامسونج نوفروست 380 لتر', en: 'Samsung No Frost Fridge 380L' },
    specs: { capacity_liters: 380, no_frost: true, warranty_years: 5 },
    isLargeItem: true,
    variants: [
      {
        sku: 'sam-rt38-sl',
        modelNumber: 'RT38K-5032S8',
        options: { color: 'silver' },
        price: 2_750_000,
        salePrice: 2_499_900,
      },
    ],
    ...overrides,
  });

  describe('categories', () => {
    it('creates a two-level tree where children inherit the parent template', async () => {
      const kitchen = await editor
        .post('/api/v1/admin/categories')
        .send({
          slug: 'Kitchen',
          name: { ar: 'المطبخ', en: 'Kitchen' },
          attributes: [{ key: 'warranty_years', label: { ar: 'سنوات الضمان' }, type: 'number' }],
        })
        .expect(201);
      ids.kitchen = kitchen.body.id;
      expect(kitchen.body.slug).toBe('kitchen');

      const fridges = await editor
        .post('/api/v1/admin/categories')
        .send({
          parentId: ids.kitchen,
          slug: 'refrigerators',
          name: { ar: 'ثلاجات', en: 'Refrigerators' },
          attributes: fridgeAttributes,
        })
        .expect(201);
      ids.fridges = fridges.body.id;
      expect(fridges.body.effectiveAttributes.map((a: { key: string }) => a.key)).toEqual([
        'warranty_years',
        'capacity_liters',
        'no_frost',
        'color',
      ]);
    });

    it('rejects a third level and keys that clash with the parent', async () => {
      const deep = await editor
        .post('/api/v1/admin/categories')
        .send({ parentId: ids.fridges, slug: 'mini-fridges', name: { ar: 'ثلاجات صغيرة' } })
        .expect(400);
      expect(deep.body.errors[0]).toMatchObject({ path: 'parentId', message: 'max_two_levels' });

      await editor
        .post('/api/v1/admin/categories')
        .send({
          parentId: ids.kitchen,
          slug: 'cookers',
          name: { ar: 'بوتاجازات' },
          attributes: [{ key: 'warranty_years', label: { ar: 'ضمان' }, type: 'number' }],
        })
        .expect(409);
    });

    it('refuses to delete a category that has subcategories', async () => {
      await editor.delete(`/api/v1/admin/categories/${ids.kitchen}`).expect(409);
    });
  });

  describe('brands', () => {
    it('creates brands and rejects duplicate slugs with 409', async () => {
      const samsung = await editor
        .post('/api/v1/admin/brands')
        .send({ slug: 'samsung', name: { ar: 'سامسونج', en: 'Samsung' } })
        .expect(201);
      ids.samsung = samsung.body.id;

      const dup = await editor
        .post('/api/v1/admin/brands')
        .send({ slug: 'samsung', name: { ar: 'سامسونج 2' } })
        .expect(409);
      expect(dup.body.title).toBe('Conflict');
    });
  });

  describe('products', () => {
    it('creates a draft, validating specs against the category template', async () => {
      const res = await editor.post('/api/v1/admin/products').send(product()).expect(201);
      ids.fridge = res.body.id;
      expect(res.body).toMatchObject({
        status: 'draft',
        specs: { capacity_liters: 380, no_frost: true, warranty_years: 5 },
        category: { id: ids.fridges },
      });
      expect(res.body.variants[0]).toMatchObject({
        sku: 'SAM-RT38-SL',
        options: { color: 'silver' },
        currentPrice: 2_499_900,
      });
    });

    it('reports spec and variant-option errors with full field paths', async () => {
      const res = await editor
        .post('/api/v1/admin/products')
        .send(
          product({
            slug: 'bad-specs',
            specs: { capacity_liters: 'big' },
            variants: [{ sku: 'BAD-1', price: 1000, options: { color: 'pink' } }],
          }),
        )
        .expect(400);
      expect(res.body.errors.map((e: { path: string }) => e.path)).toEqual([
        'specs.capacity_liters',
      ]);

      const variantRes = await editor
        .post('/api/v1/admin/products')
        .send(
          product({
            slug: 'bad-variant',
            variants: [{ sku: 'BAD-2', price: 1000, options: { color: 'pink' } }],
          }),
        )
        .expect(400);
      expect(variantRes.body.errors[0].path).toBe('variants.0.options.color');
    });

    it('rejects unknown categories and duplicate SKUs', async () => {
      const unknown = await editor
        .post('/api/v1/admin/products')
        .send(product({ slug: 'x1', categoryId: '01a15fae-6fdf-75ea-806a-000000000000' }))
        .expect(400);
      expect(unknown.body.errors[0]).toMatchObject({ path: 'categoryId', message: 'not_found' });

      await editor
        .post('/api/v1/admin/products')
        .send(product({ slug: 'x2' }))
        .expect(409);
    });

    it('syncs variants on update: keeps by id, adds new, removes missing', async () => {
      const current = (await editor.get(`/api/v1/admin/products/${ids.fridge}`).expect(200)).body;
      const res = await editor
        .put(`/api/v1/admin/products/${ids.fridge}`)
        .send(
          product({
            variants: [
              { ...current.variants[0], price: 2_800_000, salePrice: null },
              { sku: 'SAM-RT38-BK', options: { color: 'black' }, price: 2_850_000 },
            ],
          }),
        )
        .expect(200);
      expect(res.body.variants).toHaveLength(2);
      expect(res.body.variants[0]).toMatchObject({
        id: current.variants[0].id,
        currentPrice: 2_800_000,
      });

      await editor
        .put(`/api/v1/admin/products/${ids.fridge}`)
        .send(
          product({
            variants: [{ id: '01a15fae-6fdf-75ea-806a-000000000000', sku: 'Z-1', price: 100 }],
          }),
        )
        .expect(400);
    });

    it('lets clerks read but not edit or publish', async () => {
      await clerk.get('/api/v1/admin/products').expect(200);
      await clerk
        .post('/api/v1/admin/products')
        .send(product({ slug: 'clerk' }))
        .expect(403);
      await clerk
        .patch(`/api/v1/admin/products/${ids.fridge}/status`)
        .send({ status: 'active' })
        .expect(403);
    });

    it('publishes a product and records when it was first published', async () => {
      const res = await editor
        .patch(`/api/v1/admin/products/${ids.fridge}/status`)
        .send({ status: 'active' })
        .expect(200);
      expect(res.body.status).toBe('active');
      expect(res.body.publishedAt).toEqual(expect.any(String));
    });

    it('searches with Arabic normalization and model numbers, and filters by parent category', async () => {
      const list = (q: string) => editor.get('/api/v1/admin/products').query({ q }).expect(200);

      expect((await list('ثلاجه')).body.total).toBe(1); // ة/ه normalized
      expect((await list('rt38k5032s8')).body.total).toBe(1); // model number without dash
      expect((await list('washing machine')).body.total).toBe(0);

      const byParent = await editor
        .get('/api/v1/admin/products')
        .query({ categoryId: ids.kitchen, status: 'active' })
        .expect(200);
      expect(byParent.body.items).toEqual([
        expect.objectContaining({ id: ids.fridge, variantCount: 2, priceFrom: 2_800_000 }),
      ]);
    });

    it('blocks deleting a category or brand that still has products', async () => {
      await editor.delete(`/api/v1/admin/categories/${ids.fridges}`).expect(409);
      await editor.delete(`/api/v1/admin/brands/${ids.samsung}`).expect(409);
    });

    it('soft-deletes products and frees their slug and SKUs for reuse', async () => {
      await editor.delete(`/api/v1/admin/products/${ids.fridge}`).expect(204);
      await editor.get(`/api/v1/admin/products/${ids.fridge}`).expect(404);
      await editor.post('/api/v1/admin/products').send(product()).expect(201);
    });
  });
});
