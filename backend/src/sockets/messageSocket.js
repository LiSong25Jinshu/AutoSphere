import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';

// Store active users and their socket connections
const activeUsers = new Map();
const typingUsers = new Map();

/**
 * Initialize WebSocket handlers for messaging
 * @param {Server} io - Socket.io server instance
 */
export const initializeMessageSocket = (io) => {
  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      socket.userId = decoded.id;
      socket.userEmail = decoded.email;
      
      next();
    } catch (error) {
      next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);
    
    // Add user to active users
    activeUsers.set(socket.userId, socket.id);
    
    // Notify others that user is online
    socket.broadcast.emit('user:online', { userId: socket.userId });

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Handle joining conversation rooms
    socket.on('conversation:join', async (conversationId) => {
      try {
        // Verify user is part of this conversation
        const conversation = await Conversation.findOne({
          where: {
            id: conversationId,
          },
        });

        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        // Check if user is participant
        const participants = conversation.participants || [];
        if (!participants.includes(socket.userId)) {
          socket.emit('error', { message: 'Not authorized to join this conversation' });
          return;
        }

        socket.join(`conversation:${conversationId}`);
        console.log(`User ${socket.userId} joined conversation ${conversationId}`);
      } catch (error) {
        console.error('Error joining conversation:', error);
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    // Handle leaving conversation rooms
    socket.on('conversation:leave', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${socket.userId} left conversation ${conversationId}`);
    });

    // Handle new messages
    socket.on('message:send', async (data) => {
      try {
        const { conversationId, content, attachments } = data;

        // Verify user is part of this conversation
        const conversation = await Conversation.findByPk(conversationId);
        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        const participants = conversation.participants || [];
        if (!participants.includes(socket.userId)) {
          socket.emit('error', { message: 'Not authorized to send messages in this conversation' });
          return;
        }

        // Create message
        const message = await Message.create({
          conversationId,
          senderId: socket.userId,
          content,
          attachments: attachments || [],
          isRead: false,
        });

        // Update conversation's last message
        await conversation.update({
          lastMessageAt: new Date(),
          updatedAt: new Date(),
        });

        // Fetch complete message with sender info
        const completeMessage = await Message.findByPk(message.id, {
          include: [{
            model: User,
            as: 'sender',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          }],
        });

        // Emit to all users in the conversation
        io.to(`conversation:${conversationId}`).emit('message:new', completeMessage);

        // Send notification to offline users
        const recipientIds = participants.filter(id => id !== socket.userId);
        recipientIds.forEach(recipientId => {
          if (!activeUsers.has(recipientId)) {
            // User is offline, could trigger push notification here
            console.log(`User ${recipientId} is offline, should send push notification`);
          }
        });

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing:start', ({ conversationId }) => {
      const key = `${conversationId}:${socket.userId}`;
      
      if (!typingUsers.has(key)) {
        typingUsers.set(key, Date.now());
        
        // Broadcast to others in the conversation
        socket.to(`conversation:${conversationId}`).emit('typing:user', {
          conversationId,
          userId: socket.userId,
          isTyping: true,
        });
      }
    });

    socket.on('typing:stop', ({ conversationId }) => {
      const key = `${conversationId}:${socket.userId}`;
      
      if (typingUsers.has(key)) {
        typingUsers.delete(key);
        
        // Broadcast to others in the conversation
        socket.to(`conversation:${conversationId}`).emit('typing:user', {
          conversationId,
          userId: socket.userId,
          isTyping: false,
        });
      }
    });

    // Handle message read receipts
    socket.on('message:read', async ({ messageId, conversationId }) => {
      try {
        const message = await Message.findByPk(messageId);
        
        if (message && !message.isRead) {
          await message.update({ isRead: true, readAt: new Date() });
          
          // Notify sender that message was read
          io.to(`conversation:${conversationId}`).emit('message:read', {
            messageId,
            conversationId,
            readBy: socket.userId,
            readAt: new Date(),
          });
        }
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });

    // Handle marking all messages in conversation as read
    socket.on('conversation:markRead', async ({ conversationId }) => {
      try {
        await Message.update(
          { isRead: true, readAt: new Date() },
          {
            where: {
              conversationId,
              senderId: { [Op.ne]: socket.userId },
              isRead: false,
            },
          }
        );

        // Notify others in the conversation
        socket.to(`conversation:${conversationId}`).emit('conversation:read', {
          conversationId,
          readBy: socket.userId,
        });
      } catch (error) {
        console.error('Error marking conversation as read:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
      
      // Remove from active users
      activeUsers.delete(socket.userId);
      
      // Clear typing indicators
      for (const [key, _] of typingUsers.entries()) {
        if (key.endsWith(`:${socket.userId}`)) {
          const conversationId = key.split(':')[0];
          typingUsers.delete(key);
          
          // Notify others that user stopped typing
          socket.to(`conversation:${conversationId}`).emit('typing:user', {
            conversationId,
            userId: socket.userId,
            isTyping: false,
          });
        }
      }
      
      // Notify others that user is offline
      socket.broadcast.emit('user:offline', { userId: socket.userId });
    });
  });

  // Clean up stale typing indicators every 10 seconds
  setInterval(() => {
    const now = Date.now();
    const timeout = 10000; // 10 seconds
    
    for (const [key, timestamp] of typingUsers.entries()) {
      if (now - timestamp > timeout) {
        typingUsers.delete(key);
        
        const [conversationId, userId] = key.split(':');
        io.to(`conversation:${conversationId}`).emit('typing:user', {
          conversationId,
          userId: parseInt(userId),
          isTyping: false,
        });
      }
    }
  }, 10000);

  console.log('Message socket handlers initialized');
};

export { activeUsers, typingUsers };
