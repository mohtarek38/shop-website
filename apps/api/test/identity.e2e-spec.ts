import { Controller, Get, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import type { Auth } from '../src/modules/identity/auth.js';
import { ensureStaffUser, seedPermissionsAndRoles } from '../src/modules/identity/identity.seed.js';
import { AUTH } from '../src/modules/identity/identity.tokens.js';
import { RequirePermission } from '../src/modules/identity/index.js';
import { PrismaService } from '../src/shared/database/prisma.service.js';
import { createTestApp } from './create-test-app.js';

// Browsers send Origin; Better Auth checks it against AUTH_TRUSTED_ORIGINS.
const ORIGIN = 'http://localhost:3000';
const PHONE = '+201012345678';
const PASSWORD = 'customer-pass-123';
const STAFF_PASSWORD = 'staff-pass-12345';

@Controller('test-staff')
class StaffRoutesController {
  @Get('orders')
  @RequirePermission('orders.read')
  orders() {
    return { ok: true };
  }

  @Get('settings')
  @RequirePermission('settings.manage')
  settings() {
    return { ok: true };
  }
}

describe('Identity (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp([StaffRoutesController]);
    prisma = app.get(PrismaService);
    const auth = app.get<Auth>(AUTH);
    await seedPermissionsAndRoles(prisma);
    await ensureStaffUser(prisma, auth, {
      name: 'Owner',
      email: 'owner@test.local',
      password: STAFF_PASSWORD,
      roles: ['owner'],
    });
    await ensureStaffUser(prisma, auth, {
      name: 'Clerk',
      email: 'clerk@test.local',
      password: STAFF_PASSWORD,
      roles: ['clerk'],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();

  async function signInStaff(email: string) {
    const agent = request.agent(server());
    await agent
      .post('/api/auth/sign-in/email')
      .set('Origin', ORIGIN)
      .send({ email, password: STAFF_PASSWORD })
      .expect(200);
    return agent;
  }

  describe('customer registration and phone sign-in', () => {
    it('registers with phone + password, signs in, and hides the synthetic email', async () => {
      const agent = request.agent(server());
      const res = await agent
        .post('/api/v1/auth/register')
        .set('Origin', ORIGIN)
        .send({ name: 'Ahmed Mahmoud', phone: '0101 234 5678', password: PASSWORD })
        .expect(201);
      expect(String(res.headers['set-cookie'])).toMatch(/shop\.session_token=/);

      const me = await agent.get('/api/v1/me').expect(200);
      expect(me.body).toMatchObject({
        name: 'Ahmed Mahmoud',
        phone: PHONE,
        email: null,
        type: 'customer',
        locale: 'ar',
        roles: [],
        permissions: [],
      });

      const stored = await prisma.user.findUniqueOrThrow({ where: { username: PHONE } });
      expect(stored.email).toBe('201012345678@phone.invalid');
    });

    it('rejects a second account with the same phone', async () => {
      await request(server())
        .post('/api/v1/auth/register')
        .set('Origin', ORIGIN)
        .send({ name: 'Someone Else', phone: '01012345678', password: PASSWORD })
        .expect(409);
    });

    it('rejects an email that already belongs to another account', async () => {
      await request(server())
        .post('/api/v1/auth/register')
        .set('Origin', ORIGIN)
        .send({
          name: 'Email Taken',
          phone: '01112345678',
          password: PASSWORD,
          email: 'owner@test.local',
        })
        .expect(409);
    });

    it('validates input with the shared contract', async () => {
      const res = await request(server())
        .post('/api/v1/auth/register')
        .set('Origin', ORIGIN)
        .send({ name: 'A', phone: '0123', password: 'short' })
        .expect(400);
      expect(res.body.errors.map((e: { path: string }) => e.path).sort()).toEqual([
        'name',
        'password',
        'phone',
      ]);
    });

    it('keeps the raw email sign-up endpoint closed', async () => {
      await request(server())
        .post('/api/auth/sign-up/email')
        .set('Origin', ORIGIN)
        .send({ name: 'Sneaky', email: 'sneaky@example.com', password: PASSWORD })
        .expect(404);
    });

    it('signs in with the phone number as username, and signs out', async () => {
      const agent = request.agent(server());
      await agent
        .post('/api/auth/sign-in/username')
        .set('Origin', ORIGIN)
        .send({ username: PHONE, password: PASSWORD })
        .expect(200);
      await agent.get('/api/v1/me').expect(200);

      await agent.post('/api/auth/sign-out').set('Origin', ORIGIN).send({}).expect(200);
      await agent.get('/api/v1/me').expect(401);
    });

    it('rejects a wrong password', async () => {
      await request(server())
        .post('/api/auth/sign-in/username')
        .set('Origin', ORIGIN)
        .send({ username: PHONE, password: 'wrong-password' })
        .expect(401);
    });
  });

  describe('authorization', () => {
    it('returns 401 problem details for anonymous requests to private routes', async () => {
      const res = await request(server()).get('/api/v1/me').expect(401);
      expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
    });

    it('forbids customers from staff routes', async () => {
      const agent = request.agent(server());
      await agent
        .post('/api/auth/sign-in/username')
        .set('Origin', ORIGIN)
        .send({ username: PHONE, password: PASSWORD })
        .expect(200);
      await agent.get('/api/v1/test-staff/orders').expect(403);
    });

    it('applies role permissions: clerk can read orders but not manage settings', async () => {
      const clerk = await signInStaff('clerk@test.local');
      const me = await clerk.get('/api/v1/me').expect(200);
      expect(me.body).toMatchObject({ type: 'staff', roles: ['clerk'] });
      expect(me.body.permissions).toContain('orders.read');

      await clerk.get('/api/v1/test-staff/orders').expect(200);
      await clerk.get('/api/v1/test-staff/settings').expect(403);
    });

    it('lets a user change their language', async () => {
      const owner = await signInStaff('owner@test.local');
      const res = await owner.patch('/api/v1/me').send({ locale: 'en' }).expect(200);
      expect(res.body.locale).toBe('en');
      await owner.patch('/api/v1/me').send({ locale: 'fr' }).expect(400);
      expect((await owner.get('/api/v1/me')).body.locale).toBe('en');
    });

    it('gives the owner every permission', async () => {
      const owner = await signInStaff('owner@test.local');
      await owner.get('/api/v1/test-staff/settings').expect(200);
      await owner.get('/api/v1/test-staff/orders').expect(200);
    });

    it('locks out a disabled user immediately, including existing sessions', async () => {
      const clerk = await signInStaff('clerk@test.local');
      await clerk.get('/api/v1/test-staff/orders').expect(200);

      await prisma.user.update({
        where: { email: 'clerk@test.local' },
        data: { disabledAt: new Date() },
      });

      await clerk.get('/api/v1/test-staff/orders').expect(401);
      const retry = await request(server())
        .post('/api/auth/sign-in/email')
        .set('Origin', ORIGIN)
        .send({ email: 'clerk@test.local', password: STAFF_PASSWORD });
      expect(retry.status).not.toBe(200);
    });
  });
});
