import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import { createNotification } from '../utils/notifications.js';

const activeUsers = new Map(); // userId -> socketId
const typingUsers = new Map(); // "convId:userId" -> timestamp

const isParticipant = (conv, userId) =>
  conv.participant1 === userId || conv.participant2 === userId;

export const initializeMessageSocket = (io) => {
  // Auth middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication token required'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', (socket) => {
    const uid = socket.userId;
    activeUsers.set(uid, socket.id);
    socket.join(`user:${uid}`);
    socket.broadcast.emit('user:online', { userId: uid });

    // Join conversation room
    socket.on('conversation:join', async (conversationId) => {
      try {
        const conv = await Conversation.findByPk(conversationId);
        if (!conv || !isParticipant(conv, uid)) {
          return socket.emit('error', { message: 'Not authorized' });
        }
        socket.join(`conversation:${conversationId}`);
      } catch (e) {
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    socket.on('conversation:leave', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Send message via socket (real-time broadcast)
    socket.on('message:send', async ({ conversationId, content, attachments }) => {
      try {
        const conv = await Conversation.findByPk(conversationId);
        if (!conv || !isParticipant(conv, uid)) {
          return socket.emit('error', { message: 'Not authorized' });
        }

        const msg = await Message.create({
          conversationId,
          senderId: uid,
          content,
          attachments: attachments || [],
        });

        // Update conversation
        const otherId = conv.participant1 === uid ? conv.participant2 : conv.participant1;
        if (conv.participant1 === otherId) {
          conv.unreadCount1 += 1;
        } else {
          conv.unreadCount2 += 1;
        }
        conv.lastMessageAt = new Date();
        conv.lastMessageId = msg.id;
        await conv.save();

        const full = await Message.findByPk(msg.id, {
          include: [{ model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName'] }],
        });

        io.to(`conversation:${conversationId}`).emit('message:new', full);

        // Persist notification to DB + deliver via socket + web push
        const sender = full.sender;
        const senderName = sender ? `${sender.firstName} ${sender.lastName}` : 'Someone';
        const preview = content.length > 60 ? content.slice(0, 57) + '…' : content;

        createNotification({
          userId: otherId,
          type: 'message',
          title: `New message from ${senderName}`,
          message: preview,
          linkType: 'conversation',
          linkId: conversationId,
          url: '/user-messages',
          io,
        }).catch(() => {});
      } catch (e) {
        console.error('message:send error', e);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicators
    socket.on('typing:start', ({ conversationId }) => {
      const key = `${conversationId}:${uid}`;
      typingUsers.set(key, Date.now());
      socket.to(`conversation:${conversationId}`).emit('typing:user', {
        conversationId, userId: uid, isTyping: true,
      });
    });

    socket.on('typing:stop', ({ conversationId }) => {
      typingUsers.delete(`${conversationId}:${uid}`);
      socket.to(`conversation:${conversationId}`).emit('typing:user', {
        conversationId, userId: uid, isTyping: false,
      });
    });

    // Mark conversation as read
    socket.on('conversation:markRead', async ({ conversationId }) => {
      try {
        await Message.update(
          { isRead: true, readAt: new Date() },
          { where: { conversationId, senderId: { [Op.ne]: uid }, isRead: false } }
        );
        const conv = await Conversation.findByPk(conversationId);
        if (conv) {
          if (conv.participant1 === uid) conv.unreadCount1 = 0;
          else conv.unreadCount2 = 0;
          await conv.save();
        }
        socket.to(`conversation:${conversationId}`).emit('conversation:read', {
          conversationId, readBy: uid,
        });
      } catch (e) {
        console.error('markRead error', e);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      activeUsers.delete(uid);
      for (const [key] of typingUsers) {
        if (key.endsWith(`:${uid}`)) {
          const convId = key.split(':')[0];
          typingUsers.delete(key);
          socket.to(`conversation:${convId}`).emit('typing:user', {
            conversationId: convId, userId: uid, isTyping: false,
          });
        }
      }
      socket.broadcast.emit('user:offline', { userId: uid });
    });
  });

  // Stale typing cleanup every 10s
  setInterval(() => {
    const now = Date.now();
    for (const [key, ts] of typingUsers) {
      if (now - ts > 10000) {
        typingUsers.delete(key);
        const [convId, userId] = key.split(':');
        io.to(`conversation:${convId}`).emit('typing:user', {
          conversationId: convId, userId: parseInt(userId), isTyping: false,
        });
      }
    }
  }, 10000);
};

export { activeUsers, typingUsers };
