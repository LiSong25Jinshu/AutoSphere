import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../server.js';
import User from '../../models/User.js';
import { hashPassword } from '../../utils/password.js';
import { generateAccessToken } from '../../utils/jwt.js';

const timestamp = Date.now();
let dealerToken = '';
let userToken = '';
let createdVehicleId = null;

const dealerUser = {
  email: `dealer_${timestamp}@autosphere.test`,
  password: 'DealerPass123!',
  firstName: 'Dealer',
  lastName: 'Test',
  role: 'dealer',
};

const regularUser = {
  email: `user_${timestamp}@autosphere.test`,
  password: 'UserPass123!',
  firstName: 'Regular',
  lastName: 'User',
  role: 'user',
};

const testVehicle = {
  make: 'Toyota',
  model: 'Camry',
  year: 2022,
  price: 28000,
  mileage: 15000,
  fuelType: 'Gasoline',
  transmission: 'Automatic',
  bodyType: 'Sedan',
  color: 'Silver',
  availabilityType: 'sale',
  description: 'Well-maintained Toyota Camry in excellent condition.',
};

describe('E2E: Vehicle Marketplace Flow', () => {
  beforeAll(async () => {
    // Create dealer user
    const dealer = await User.create({
      email: dealerUser.email,
      passwordHash: await hashPassword(dealerUser.password),
      firstName: dealerUser.firstName,
      lastName: dealerUser.lastName,
      role: 'dealer',
      isVerified: true,
    });
    dealerToken = generateAccessToken({ id: dealer.id, email: dealer.email, role: dealer.role });

    // Create regular user
    const user = await User.create({
      email: regularUser.email,
      passwordHash: await hashPassword(regularUser.password),
      firstName: regularUser.firstName,
      lastName: regularUser.lastName,
      role: 'user',
      isVerified: true,
    });
    userToken = generateAccessToken({ id: user.id, email: user.email, role: user.role });
  });

  afterAll(async () => {
    await User.destroy({ where: { email: [dealerUser.email, regularUser.email] } }).catch(() => {});
  });

  // ─── Public Vehicle Browsing ─────────────────────────────────────────────────

  describe('GET /api/vehicles', () => {
    it('returns vehicle list without authentication', async () => {
      const res = await request(app)
        .get('/api/vehicles')
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('supports pagination parameters', async () => {
      const res = await request(app)
        .get('/api/vehicles?page=1&limit=5')
        .expect(200);

      expect(res.body).toHaveProperty('data');
    });

    it('supports filtering by make', async () => {
      const res = await request(app)
        .get('/api/vehicles?make=Toyota')
        .expect(200);

      expect(res.body).toHaveProperty('data');
    });

    it('supports filtering by availability type', async () => {
      const res = await request(app)
        .get('/api/vehicles?availabilityType=sale')
        .expect(200);

      expect(res.body).toHaveProperty('data');
    });
  });

  // ─── Dealer Creates Vehicle ──────────────────────────────────────────────────

  describe('POST /api/vehicles', () => {
    it('allows dealer to create a vehicle listing', async () => {
      const res = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${dealerToken}`)
        .send(testVehicle)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        make: testVehicle.make,
        model: testVehicle.model,
        year: testVehicle.year,
      });

      createdVehicleId = res.body.data.id;
    });

    it('rejects vehicle creation without authentication', async () => {
      await request(app)
        .post('/api/vehicles')
        .send(testVehicle)
        .expect(401);
    });

    it('rejects vehicle creation by regular user', async () => {
      const res = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${userToken}`)
        .send(testVehicle)
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('rejects vehicle with missing required fields', async () => {
      const res = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${dealerToken}`)
        .send({ make: 'Toyota' }) // missing model, year, price etc.
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ─── Get Single Vehicle ──────────────────────────────────────────────────────

  describe('GET /api/vehicles/:id', () => {
    it('returns vehicle details by ID', async () => {
      if (!createdVehicleId) return;

      const res = await request(app)
        .get(`/api/vehicles/${createdVehicleId}`)
        .expect(200);

      expect(res.body.data).toMatchObject({
        id: createdVehicleId,
        make: testVehicle.make,
        model: testVehicle.model,
      });
    });

    it('returns 404 for non-existent vehicle', async () => {
      await request(app)
        .get('/api/vehicles/99999999')
        .expect(404);
    });
  });

  // ─── Update Vehicle ──────────────────────────────────────────────────────────

  describe('PUT /api/vehicles/:id', () => {
    it('allows dealer to update their vehicle', async () => {
      if (!createdVehicleId) return;

      const res = await request(app)
        .put(`/api/vehicles/${createdVehicleId}`)
        .set('Authorization', `Bearer ${dealerToken}`)
        .send({ price: 26000 })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('rejects update without authentication', async () => {
      if (!createdVehicleId) return;

      await request(app)
        .put(`/api/vehicles/${createdVehicleId}`)
        .send({ price: 25000 })
        .expect(401);
    });
  });

  // ─── Delete Vehicle ──────────────────────────────────────────────────────────

  describe('DELETE /api/vehicles/:id', () => {
    it('allows dealer to delete their vehicle', async () => {
      if (!createdVehicleId) return;

      const res = await request(app)
        .delete(`/api/vehicles/${createdVehicleId}`)
        .set('Authorization', `Bearer ${dealerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
