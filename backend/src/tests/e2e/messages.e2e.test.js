import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../server.js';
import User from '../../models/User.js';
import { hashPassword } from '../../utils/password.js';
import { generateAccessToken } from '../../utils/jwt.js';

const timestamp = Date.now();
let senderToken = '';
let receiverToken = '';
let senderId = null;
let receiverId = null;
let conversationId = null;

const sender = {
  email: `sender_${timestamp}@autosphere.test`,
  password: 'SenderPass123!',
  firstName: 'Sender',
  lastName: 'User',
  role: 'user',
};

const receiver = {
  email: `receiver_${timestamp}@autosphere.test`,
  password: 'ReceiverPass123!',
  firstName: 'Receiver',
  lastName: 'User',
  role: 'dealer',
};

describe('E2E: Messaging Flow', () => {
  beforeAll(async () => {
    const senderUser = await User.create({
      email: sender.email,
      passwordHash: await hashPassword(sender.password),
      firstName: sender.firstName,
      lastName: sender.lastName,
      role: 'user',
      isVerified: true,
    });
    senderId = senderUser.id;
    senderToken = generateAccessToken({ id: senderUser.id, email: senderUser.email, role: senderUser.role });

    const receiverUser = await User.create({
      email: receiver.email,
      passwordHash: await hashPassword(receiver.password),
      firstName: receiver.firstName,
      lastName: receiver.lastName,
      role: 'dealer',
      isVerified: true,
    });
    receiverId = receiverUser.id;
    receiverToken = generateAccessToken({ id: receiverUser.id, email: receiverUser.email, role: receiverUser.role });
  });

  afterAll(async () => {
    await User.destroy({ where: { email: [sender.email, receiver.email] } }).catch(() => {});
  });

  // ─── Start Conversation ──────────────────────────────────────────────────────

  describe('POST /api/messages/conversations', () => {
    it('creates a new conversation between two users', async () => {
      const res = await request(app)
        .post('/api/messages/conversations')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({ participantId: receiverId })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');

      conversationId = res.body.data.id;
    });

    it('returns existing conversation if already started', async () => {
      const res = await request(app)
        .post('/api/messages/conversations')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({ participantId: receiverId })
        .expect(200); // 200 = existing, 201 = new

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(conversationId);
    });

    it('rejects without authentication', async () => {
      await request(app)
        .post('/api/messages/conversations')
        .send({ participantId: receiverId })
        .expect(401);
    });
  });

  // ─── Send Message ────────────────────────────────────────────────────────────

  describe('POST /api/messages', () => {
    it('sends a message in a conversation', async () => {
      if (!conversationId) return;

      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          conversationId,
          content: 'Hello! Is the vehicle still available?',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe('Hello! Is the vehicle still available?');
    });

    it('rejects empty message content', async () => {
      if (!conversationId) return;

      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({ conversationId, content: '' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('rejects message without authentication', async () => {
      await request(app)
        .post('/api/messages')
        .send({ conversationId, content: 'Unauthorized message' })
        .expect(401);
    });
  });

  // ─── Get Conversations ───────────────────────────────────────────────────────

  describe('GET /api/messages/conversations', () => {
    it('returns list of conversations for authenticated user', async () => {
      const res = await request(app)
        .get('/api/messages/conversations')
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('rejects unauthenticated request', async () => {
      await request(app)
        .get('/api/messages/conversations')
        .expect(401);
    });
  });

  // ─── Get Messages in Conversation ───────────────────────────────────────────

  describe('GET /api/messages/:conversationId', () => {
    it('returns messages for a conversation participant', async () => {
      if (!conversationId) return;

      const res = await request(app)
        .get(`/api/messages/${conversationId}`)
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('allows receiver to read the same conversation', async () => {
      if (!conversationId) return;

      const res = await request(app)
        .get(`/api/messages/${conversationId}`)
        .set('Authorization', `Bearer ${receiverToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('rejects access from non-participant', async () => {
      if (!conversationId) return;

      // Create a third user who is not part of this conversation
      const outsider = await User.create({
        email: `outsider_${timestamp}@autosphere.test`,
        passwordHash: await hashPassword('OutsiderPass123!'),
        firstName: 'Outsider',
        lastName: 'User',
        role: 'user',
        isVerified: true,
      });
      const outsiderToken = generateAccessToken({ id: outsider.id, email: outsider.email, role: outsider.role });

      await request(app)
        .get(`/api/messages/${conversationId}`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .expect(403);

      await User.destroy({ where: { id: outsider.id } }).catch(() => {});
    });
  });
});
