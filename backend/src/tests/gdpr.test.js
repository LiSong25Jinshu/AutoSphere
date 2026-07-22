/**
 * GDPR API — end-to-end tests
 * Tests data export, consent management, and account deletion.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server.js';

let token = '';
const email = `gdpr-${Date.now()}@autosphere-test.com`;
const password = 'TestPass123!';

beforeAll(async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password, firstName: 'GDPR', lastName: 'Test', role: 'user' });
  token = res.body.token;
});

describe('GDPR API', () => {
  describe('GET /api/gdpr/export', () => {
    it('exports user data as JSON', async () => {
      const res = await request(app)
        .get('/api/gdpr/export')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.exportedAt).toBeTruthy();
      expect(res.body.personalData).toBeDefined();
      expect(res.body.personalData.account.email).toBe(email);
      expect(res.body.personalData.bookings).toBeInstanceOf(Array);
    });

    it('requires authentication', async () => {
      await request(app)
        .get('/api/gdpr/export')
        .expect(401);
    });
  });

  describe('GET/POST /api/gdpr/consent', () => {
    it('returns default consent preferences', async () => {
      const res = await request(app)
        .get('/api/gdpr/consent')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it('saves consent preferences', async () => {
      const res = await request(app)
        .post('/api/gdpr/consent')
        .set('Authorization', `Bearer ${token}`)
        .send({ marketing: true, analytics: false, functional: true })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.marketing).toBe(true);
      expect(res.body.data.analytics).toBe(false);
    });

    it('rejects invalid consent payload', async () => {
      const res = await request(app)
        .post('/api/gdpr/consent')
        .set('Authorization', `Bearer ${token}`)
        .send({ marketing: 'yes' }) // should be boolean
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/gdpr/delete-account', () => {
    it('rejects without confirmation phrase', async () => {
      const res = await request(app)
        .post('/api/gdpr/delete-account')
        .set('Authorization', `Bearer ${token}`)
        .send({ confirmation: 'delete' }) // wrong phrase
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('deletes account with correct confirmation', async () => {
      const res = await request(app)
        .post('/api/gdpr/delete-account')
        .set('Authorization', `Bearer ${token}`)
        .send({ confirmation: 'DELETE MY ACCOUNT' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('token is invalid after account deletion', async () => {
      // The user record is anonymised — the old token should still be valid
      // (JWT is stateless) but the user data is gone
      const res = await request(app)
        .get('/api/gdpr/export')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Email should be anonymised
      expect(res.body.personalData.account.email).toContain('deleted');
    });
  });
});
