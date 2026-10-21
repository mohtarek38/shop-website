import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import type { Auth } from '../src/modules/identity/auth.js';
import { ensureStaffUser, seedPermissionsAndRoles } from '../src/modules/identity/identity.seed.js';
import { AUTH } from '../src/modules/identity/identity.tokens.js';
import { PrismaService } from '../src/shared/database/prisma.service.js';
import { createTestApp } from './create-test-app.js';

const ORIGIN = 'http://localhost:5173';
const PASSWORD = 'stock-staff-12345';

describe('Inventory (e2e)', () => {
  let app: INestApplication<App>;
  let manager: ReturnType<typeof request.agent>;
  let clerk: ReturnType<typeof request.agent>;
  let variantId: string;
  let productId: string;
  let main: string;
  let branch: string;

  async function signIn(email: string) {
    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/api/auth/sign-in/email')
      .set('Origin', ORIGIN)
      .send({ email, password: PASSWORD })
      .expect(200);
    return agent;
  }

  const stockOf = async () => {
    const res = await manager.get('/api/v1/admin/inventory').query({ q: 'STOCK-1' }).expect(200);
    return res.body.items[0];
  };

  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    const auth = app.get<Auth>(AUTH);
    await seedPermissionsAndRoles(prisma);
    for (const [email, role] of [
      ['stock-manager@test.local', 'manager'],
      ['stock-clerk@test.local', 'clerk'],
    ] as const) {
      await ensureStaffUser(prisma, auth, { name: role, email, password: PASSWORD, roles: [role] });
    }
    manager = await signIn('stock-manager@test.local');
    clerk = await signIn('stock-clerk@test.local');

    const category = await manager
      .post('/api/v1/admin/categories')
      .send({ slug: 'stock-test-cat', name: { ar: 'قسم المخزون' } })
      .expect(201);
    const brand = await manager
      .post('/api/v1/admin/brands')
      .send({ slug: 'stock-test-brand', name: { ar: 'ماركة المخزون' } })
      .expect(201);
    const product = await manager
      .post('/api/v1/admin/products')
      .send({
        categoryId: category.body.id,
        brandId: brand.body.id,
        slug: 'stock-test-product',
        name: { ar: 'منتج المخزون' },
        variants: [{ sku: 'STOCK-1', price: 10_000 }],
      })
      .expect(201);
    productId = product.body.id;
    variantId = product.body.variants[0].id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('locations', () => {
    it('makes the first location the default and keeps exactly one default', async () => {
      const existing = (await manager.get('/api/v1/admin/stock-locations').expect(200)).body;
      const first = await manager
        .post('/api/v1/admin/stock-locations')
        .send({ code: 'main-test', name: { ar: 'الرئيسي' }, isDefault: existing.length === 0 })
        .expect(201);
      main = first.body.id;
      expect(first.body.code).toBe('MAIN-TEST');

      const second = await manager
        .post('/api/v1/admin/stock-locations')
        .send({ code: 'BRANCH', name: { ar: 'الفرع' }, isDefault: true })
        .expect(201);
      branch = second.body.id;

      const all = (await manager.get('/api/v1/admin/stock-locations').expect(200)).body;
      expect(
        all.filter((l: { isDefault: boolean }) => l.isDefault).map((l: { id: string }) => l.id),
      ).toEqual([branch]);

      // The default can move, but not disappear.
      const unset = await manager
        .put(`/api/v1/admin/stock-locations/${branch}`)
        .send({ code: 'BRANCH', name: { ar: 'الفرع' }, isDefault: false })
        .expect(400);
      expect(unset.body.errors[0]).toMatchObject({
        path: 'isDefault',
        message: 'default_required',
      });
    });

    it('rejects duplicate codes on the code field', async () => {
      const res = await manager
        .post('/api/v1/admin/stock-locations')
        .send({ code: 'branch', name: { ar: 'مكرر' } })
        .expect(400);
      expect(res.body.errors[0]).toMatchObject({ path: 'code', message: 'already_exists' });
    });
  });

  describe('stock changes', () => {
    it('receives, writes off and counts stock, recording each change in the ledger', async () => {
      const post = (body: object) =>
        manager
          .post('/api/v1/admin/inventory/adjustments')
          .send({ variantId, locationId: main, ...body });

      await post({ type: 'receive', quantity: 10 }).expect(204);
      await post({ type: 'write_off', quantity: 3, reason: 'تالف' }).expect(204);
      await post({ type: 'adjust', quantity: 6, reason: 'جرد' }).expect(204);

      const row = await stockOf();
      expect(row.levels.find((l: { locationId: string }) => l.locationId === main)).toMatchObject({
        onHand: 6,
        available: 6,
      });

      const ledger = (
        await manager.get(`/api/v1/admin/inventory/${variantId}/movements`).expect(200)
      ).body;
      expect(
        ledger.map((m: { type: string; onHandDelta: number; onHandAfter: number }) => [
          m.type,
          m.onHandDelta,
          m.onHandAfter,
        ]),
      ).toEqual([
        ['adjust', -1, 6],
        ['write_off', -3, 7],
        ['receive', 10, 10],
      ]);
      expect(ledger[0]).toMatchObject({ reason: 'جرد', actorName: 'manager' });
    });

    it('refuses to remove more than is available', async () => {
      const res = await manager
        .post('/api/v1/admin/inventory/adjustments')
        .send({ variantId, locationId: main, type: 'write_off', quantity: 7, reason: 'x' })
        .expect(400);
      expect(res.body.errors[0]).toMatchObject({ path: 'quantity', message: 'insufficient_stock' });
    });

    it('transfers between locations atomically', async () => {
      await manager
        .post('/api/v1/admin/inventory/transfers')
        .send({ variantId, fromLocationId: main, toLocationId: branch, quantity: 2 })
        .expect(204);
      const row = await stockOf();
      const at = (id: string) =>
        row.levels.find((l: { locationId: string }) => l.locationId === id).onHand;
      expect([at(main), at(branch), row.total.onHand]).toEqual([4, 2, 6]);

      const halves = await prisma.stockMovement.findMany({
        where: { variantId, referenceType: 'transfer' },
      });
      expect(halves.map((m) => m.type).sort()).toEqual(['transfer_in', 'transfer_out']);
      expect(halves[0]!.referenceId).toBeTruthy();
      expect(halves[0]!.referenceId).toBe(halves[1]!.referenceId);

      const tooMuch = await manager
        .post('/api/v1/admin/inventory/transfers')
        .send({ variantId, fromLocationId: branch, toLocationId: main, quantity: 3 })
        .expect(400);
      expect(tooMuch.body.errors[0].message).toBe('insufficient_stock');
    });

    it('does not lose updates when changes happen at the same time', async () => {
      const before = (await stockOf()).total.onHand;
      await Promise.all(
        Array.from({ length: 10 }, () =>
          manager
            .post('/api/v1/admin/inventory/adjustments')
            .send({ variantId, locationId: main, type: 'receive', quantity: 1 })
            .expect(204),
        ),
      );
      expect((await stockOf()).total.onHand).toBe(before + 10);
    });
  });

  describe('reading stock', () => {
    it('flags low stock by threshold and shows availability in the catalog', async () => {
      await manager
        .put('/api/v1/admin/inventory/thresholds')
        .send({ variantId, locationId: branch, lowStockThreshold: 5 })
        .expect(204);
      const low = await manager
        .get('/api/v1/admin/inventory')
        .query({ lowStock: 'true' })
        .expect(200);
      expect(low.body.items.map((r: { sku: string }) => r.sku)).toContain('STOCK-1');

      const product = (await manager.get(`/api/v1/admin/products/${productId}`).expect(200)).body;
      expect(product.variants[0].available).toBe(16);
    });

    it('lets clerks read stock but not change it', async () => {
      await clerk.get('/api/v1/admin/inventory').expect(200);
      await clerk
        .post('/api/v1/admin/inventory/adjustments')
        .send({ variantId, locationId: main, type: 'receive', quantity: 1 })
        .expect(403);
    });
  });
});
