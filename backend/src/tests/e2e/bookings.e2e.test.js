import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../server.js';
import User from '../../models/User.js';
import { hashPassword } from '../../utils/password.js';
import { generateAccessToken } from '../../utils/jwt.js';

const timestamp = Date.now();
let userToken = '';
let providerToken = '';
let createdBookingId = null;

const testUser = {
  email: `booking_user_${timestamp}@autosphere.test`,
  password: 'UserPass123!',
  firstName: 'Booking',
  lastName: 'User',
  role: 'user',
};

const testProvider = {
  email: `booking_provider_${timestamp}@autosphere.test`,
  password: 'ProviderPass123!',
  firstName: 'Service',
  lastName: 'Provider',
  role: 'service_provider',
};

const testBooking = {
  serviceType: 'Oil Change',
  date: '2025-06-15',
  time: '10:00',
  vehicleInfo: '2020 Toyota Camry - ABC123',
  notes: 'Please check tire pressure as well.',
};

describe('E2E: Service Booking Flow', () => {
  beforeAll(async () => {
    const user = await User.create({
      email: testUser.email,
      passwordHash: await hashPassword(testUser.password),
      firstName: testUser.firstName,
      lastName: testUser.lastName,
      role: 'user',
      isVerified: true,
    });
    userToken = generateAccessToken({ id: user.id, email: user.email, role: user.role });

    const provider = await User.create({
      email: testProvider.email,
      passwordHash: await hashPassword(testProvider.password),
      firstName: testProvider.firstName,
      lastName: testProvider.lastName,
      role: 'service_provider',
      isVerified: true,
    });
    providerToken = generateAccessToken({ id: provider.id, email: provider.email, role: provider.role });
  });

  afterAll(async () => {
    await User.destroy({ where: { email: [testUser.email, testProvider.email] } }).catch(() => {});
  });

  // ─── Create Booking ──────────────────────────────────────────────────────────

  describe('POST /api/bookings', () => {
    it('allows authenticated user to create a booking', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .send(testBooking)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        serviceType: testBooking.serviceType,
        date: testBooking.date,
      });

      createdBookingId = res.body.data.id;
    });

    it('rejects booking creation without authentication', async () => {
      await request(app)
        .post('/api/bookings')
        .send(testBooking)
        .expect(401);
    });

    it('rejects booking with missing required fields', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ serviceType: 'Oil Change' }) // missing date, time
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('rejects booking with past date', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ ...testBooking, date: '2020-01-01' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ─── Get User Bookings ───────────────────────────────────────────────────────

  describe('GET /api/bookings', () => {
    it('returns bookings for authenticated user', async () => {
      const res = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('rejects unauthenticated request', async () => {
      await request(app)
        .get('/api/bookings')
        .expect(401);
    });
  });

  // ─── Get Single Booking ──────────────────────────────────────────────────────

  describe('GET /api/bookings/:id', () => {
    it('returns booking details for the owner', async () => {
      if (!createdBookingId) return;

      const res = await request(app)
        .get(`/api/bookings/${createdBookingId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.data.id).toBe(createdBookingId);
    });

    it('returns 404 for non-existent booking', async () => {
      await request(app)
        .get('/api/bookings/99999999')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });

  // ─── Update Booking ──────────────────────────────────────────────────────────

  describe('PUT /api/bookings/:id', () => {
    it('allows user to update their booking', async () => {
      if (!createdBookingId) return;

      const res = await request(app)
        .put(`/api/bookings/${createdBookingId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ notes: 'Updated notes - also check brakes' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('rejects update without authentication', async () => {
      if (!createdBookingId) return;

      await request(app)
        .put(`/api/bookings/${createdBookingId}`)
        .send({ notes: 'Unauthorized update' })
        .expect(401);
    });
  });

  // ─── Cancel Booking ──────────────────────────────────────────────────────────

  describe('DELETE /api/bookings/:id', () => {
    it('allows user to cancel their booking', async () => {
      if (!createdBookingId) return;

      const res = await request(app)
        .delete(`/api/bookings/${createdBookingId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('returns 404 after booking is cancelled', async () => {
      if (!createdBookingId) return;

      await request(app)
        .get(`/api/bookings/${createdBookingId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });
});
