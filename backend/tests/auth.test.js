const request = require('supertest');
const app = require('../src/app'); // adjust if your main file exports differently
const { sequelize, User } = require('../src/config/database');
const crypto = require('crypto');

describe('Authentication Endpoints', () => {
  let testUserId;
  const testUser = {
    email: 'testuser@example.com',
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    phone: '+1234567890',
    isVerified: true,
  };

  beforeAll(async () => {
    // Ensure DB is synced and clean
    await sequelize.sync({ force: true });

    // Create test user
    const user = await User.create({
      email: testUser.email,
      passwordHash: testUser.password, // assuming passwordHash accepts plain string
      firstName: testUser.firstName,
      lastName: testUser.lastName,
      role: testUser.role,
      phone: testUser.phone,
      isVerified: testUser.isVerified,
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('Login with valid credentials returns JWT', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user.email).toBe(testUser.email);
    expect(response.body.user.id).toBe(testUserId);
  });

  test('Login with invalid credentials returns 401', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' })
      .expect(401);

    expect(response.body).toHaveProperty('error');
  });

  test('User can be created with phone number', async () => {
    const newUser = await User.create({
      email: 'newtest@example.com',
      passwordHash: 'hashedpassword',
      firstName: 'New',
      lastName: 'Test',
      role: 'user',
      phone: '+1987654321',
      isVerified: true,
    });

    const fetched = await User.findByPk(newUser.id);
    expect(fetched.phone).toBe('+1987654321');
  });

  test('Phone validation rejects too short number', async () => {
    await expect(
      User.create({
        email: 'shortphone@example.com',
        passwordHash: 'hash',
        firstName: 'Short',
        lastName: 'Phone',
        role: 'user',
        phone: '12345', // too short
      })
    ).rejects.toThrow(/Phone number must be between 10 and 20 characters/);
  });
});