/**
 * Vehicles API — end-to-end tests
 * Tests vehicle listing, search, and dealer-only operations.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server.js';

let dealerToken = '';
let userToken = '';
let createdVehicleId = null;

const dealerEmail = `dealer-${Date.now()}@autosphere-test.com`;
const userEmail = `user-${Date.now()}@autosphere-test.com`;
const password = 'TestPass123!';

beforeAll(async () => {
  // Register a dealer
  const dealerRes = await request(app)
    .post('/api/auth/register')
    .send({ email: dealerEmail, password, firstName: 'Test', lastName: 'Dealer', role: 'dealer' });
  dealerToken = dealerRes.body.token;

  // Register a regular user
  const userRes = await request(app)
    .post('/api/auth/register')
    .send({ email: userEmail, password, firstName: 'Test', lastName: 'User', role: 'user' });
  userToken = userRes.body.token;
});

describe('Vehicles API', () => {
  describe('GET /api/vehicles', () => {
    it('returns vehicle list publicly', async () => {
      const res = await request(app)
        .get('/api/vehicles')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });

    it('supports pagination params', async () => {
      const res = await request(app)
        .get('/api/vehicles?page=1&limit=5')
        .expect(200);

      expect(res.body.pagination.limit).toBe(5);
      expect(res.body.pagination.page).toBe(1);
    });

    it('rejects invalid page param', async () => {
      const res = await request(app)
        .get('/api/vehicles?page=0')
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/vehicles (dealer only)', () => {
    it('allows dealer to create a vehicle', async () => {
      const res = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${dealerToken}`)
        .send({
          make: 'Toyota',
          model: 'Camry',
          year: 2022,
          price: 28500,
          condition: 'used',
          fuelType: 'gasoline',
          transmission: 'automatic',
          bodyType: 'sedan',
          mileage: 15000,
          color: 'Silver',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.make).toBe('Toyota');
      createdVehicleId = res.body.data.id;
    });

    it('blocks regular user from creating a vehicle', async () => {
      await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          make: 'Honda',
          model: 'Civic',
          year: 2021,
          price: 22000,
          condition: 'used',
          fuelType: 'gasoline',
          transmission: 'automatic',
          bodyType: 'sedan',
        })
        .expect(403);
    });

    it('blocks unauthenticated vehicle creation', async () => {
      await request(app)
        .post('/api/vehicles')
        .send({ make: 'Honda', model: 'Civic', year: 2021, price: 22000 })
        .expect(401);
    });
  });

  describe('GET /api/vehicles/:id', () => {
    it('returns vehicle details by ID', async () => {
      if (!createdVehicleId) return; // skip if creation failed (no DB)

      const res = await request(app)
        .get(`/api/vehicles/${createdVehicleId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdVehicleId);
    });

    it('returns 404 for non-existent vehicle', async () => {
      const res = await request(app)
        .get('/api/vehicles/999999')
        .expect(404);

      expect(res.body.success).toBe(false);
    });

    it('returns 400 for invalid ID', async () => {
      const res = await request(app)
        .get('/api/vehicles/not-a-number')
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });
});
