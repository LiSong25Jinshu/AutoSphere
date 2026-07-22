import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../server.js';
import { sequelize } from '../../models/index.js';
import User from '../../models/User.js';

// Unique email per test run to avoid conflicts
const timestamp = Date.now();
const testUser = {
  email: `testuser_${timestamp}@autosphere.test`,
  password: 'TestPass123!',
  firstName: 'Test',
  lastName: 'User',
  role: 'user',
};

let authToken = '';

describe('E2E: Authentication Flow', () => {
  beforeAll(async () => {
    // Clean up any leftover test users
    await User.destroy({ where: { email: testUser.email } }).catch(() => {});
  });

  afterAll(async () => {
    await User.destroy({ where: { email: testUser.email } }).catch(() => {});
  });

  // ─── Registration ────────────────────────────────────────────────────────────

  describe('POST /api/auth/register', () => {
    it('registers a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.user).toMatchObject({
        email: testUser.email,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        role: testUser.role,
      });
      // Password hash must never be exposed
      expect(res.body.user.passwordHash).toBeUndefined();
    });

    it('rejects duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('rejects invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...testUser, email: 'not-an-email' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('rejects short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...testUser, email: `short_${timestamp}@test.com`, password: '123' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('rejects missing required fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: `missing_${timestamp}@test.com`, password: 'TestPass123!' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ─── Login ───────────────────────────────────────────────────────────────────

  describe('POST /api/auth/login', () => {
    it('logs in with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeTruthy();
      expect(res.body.user.email).toBe(testUser.email);

      authToken = res.body.token; // save for subsequent tests
    });

    it('rejects wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'WrongPassword!' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('rejects non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@autosphere.test', password: 'TestPass123!' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('rejects missing credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ─── Protected Route ─────────────────────────────────────────────────────────

  describe('GET /api/auth/me', () => {
    it('returns current user with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(testUser.email);
    });

    it('rejects request without token', async () => {
      await request(app)
        .get('/api/auth/me')
        .expect(401);
    });

    it('rejects request with invalid token', async () => {
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });
  });
});
