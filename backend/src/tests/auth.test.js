/**
 * Auth API — end-to-end tests
 * Tests the full register → login → protected route flow.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../server.js';

// Unique email per test run to avoid conflicts
const testEmail = `test-${Date.now()}@autosphere-test.com`;
const testPassword = 'TestPass123!';
let authToken = '';
let userId = null;

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('registers a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          firstName: 'Test',
          lastName: 'User',
          role: 'user',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.user).toMatchObject({
        email: testEmail,
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
      });
      expect(res.body.token).toBeTruthy();
      expect(res.body.user.passwordHash).toBeUndefined(); // never exposed
      userId = res.body.user.id;
    });

    it('rejects duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(409);

      expect(res.body.success).toBe(false);
    });

    it('rejects invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          password: testPassword,
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('rejects short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: `short-${Date.now()}@test.com`,
          password: '123',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: testPassword })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeTruthy();
      expect(res.body.user.email).toBe(testEmail);
      authToken = res.body.token;
    });

    it('rejects wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: 'WrongPassword!' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('rejects non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@nowhere.com', password: testPassword })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns current user with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(testEmail);
    });

    it('returns 401 without token', async () => {
      await request(app)
        .get('/api/auth/me')
        .expect(401);
    });

    it('returns 401 with invalid token', async () => {
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });
  });
});
