import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { authenticateToken } from '../middleware/auth.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';

const router = express.Router();

// Get conversations for authenticated user
router.get('/conversations', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
], authenticateToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const conversations = await Conversation.findByUser(req.user.id, {
      include: [
        {
          model: User,
          as: 'firstParticipant',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: User,
          as: 'secondParticipant',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: Message,
          as: 'lastMessage',
          attributes: ['id', 'content', 'messageType', 'createdAt'],
          include: [{
            model: User,
            as: 'sender',
            attributes: ['id', 'firstName', 'lastName'],
          }],
        },
      ],
      limit,
      offset,
    });

    // Add unread count for each conversation
    const conversationsWithUnread = conversations.map(conv => {
      const convData = conv.toJSON();
      convData.unreadCount = conv.getUnreadCount(req.user.id);
      convData.otherParticipant = conv.getOtherParticipant(req.user.id);
      return convData;
    });

    const totalCount = await Conversation.count({
      where: {
        [Op.or]: [
          { participant1: req.user.id },
          { participant2: req.user.id },
        ],
        status: 'active',
      },
    });

    res.json({
      success: true,
      data: conversationsWithUnread,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get messages in a conversation
router.get('/conversations/:conversationId/messages', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
], authenticateToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const conversationId = parseInt(req.params.conversationId);
    
    if (isNaN(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID'
      });
    }

    // Check if user is part of this conversation
    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const isParticipant = conversation.participant1 === req.user.id || 
                         conversation.participant2 === req.user.id;

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const messages = await Message.findByConversation(conversationId, {
      include: [{
        model: User,
        as: 'sender',
        attributes: ['id', 'firstName', 'lastName'],
      }],
      order: [['createdAt', 'DESC']], // Most recent first
      limit,
      offset,
    });

    // Mark messages as read
    await Message.markConversationAsRead(conversationId, req.user.id);
    await conversation.resetUnreadCount(req.user.id);

    const totalCount = await Message.count({
      where: { conversationId },
    });

    res.json({
      success: true,
      data: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Send a message
router.post('/conversations/:conversationId/messages', [
  body('content').notEmpty().trim().isLength({ min: 1, max: 5000 }),
  body('messageType').optional().isIn(['text', 'image', 'file']),
  body('replyToId').optional().isInt(),
], authenticateToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const conversationId = parseInt(req.params.conversationId);
    
    if (isNaN(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID'
      });
    }

    // Check if user is part of this conversation
    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const isParticipant = conversation.participant1 === req.user.id || 
                         conversation.participant2 === req.user.id;

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Verify reply message exists if replyToId is provided
    if (req.body.replyToId) {
      const replyMessage = await Message.findOne({
        where: {
          id: req.body.replyToId,
          conversationId,
        },
      });

      if (!replyMessage) {
        return res.status(400).json({
          success: false,
          message: 'Reply message not found'
        });
      }
    }

    const messageData = {
      conversationId,
      senderId: req.user.id,
      content: req.body.content,
      messageType: req.body.messageType || 'text',
      replyToId: req.body.replyToId || null,
    };

    const message = await Message.create(messageData);

    // Update conversation
    await conversation.updateLastMessage(message.id);
    
    // Increment unread count for the other participant
    const otherParticipantId = conversation.getOtherParticipant(req.user.id);
    await conversation.incrementUnreadCount(otherParticipantId);

    // Fetch complete message with sender info
    const completeMessage = await Message.findByPk(message.id, {
      include: [{
        model: User,
        as: 'sender',
        attributes: ['id', 'firstName', 'lastName'],
      }],
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: completeMessage,
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Start a new conversation
router.post('/conversations', [
  body('participantId').isInt().withMessage('Participant ID is required'),
  body('initialMessage').notEmpty().trim().isLength({ min: 1, max: 5000 }),
  body('conversationType').optional().isIn(['direct', 'support', 'booking_related']),
  body('relatedBookingId').optional().isInt(),
  body('relatedVehicleId').optional().isInt(),
], authenticateToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { participantId, initialMessage, conversationType, relatedBookingId, relatedVehicleId } = req.body;

    // Check if participant exists
    const participant = await User.findByPk(participantId);
    if (!participant) {
      return res.status(400).json({
        success: false,
        message: 'Participant not found'
      });
    }

    // Can't start conversation with yourself
    if (participantId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot start conversation with yourself'
      });
    }

    // Find or create conversation
    const conversation = await Conversation.findOrCreateByParticipants(
      req.user.id,
      participantId,
      {
        conversationType: conversationType || 'direct',
        relatedBookingId,
        relatedVehicleId,
      }
    );

    // Create initial message
    const message = await Message.create({
      conversationId: conversation.id,
      senderId: req.user.id,
      content: initialMessage,
      messageType: 'text',
    });

    // Update conversation
    await conversation.updateLastMessage(message.id);
    await conversation.incrementUnreadCount(participantId);

    // Fetch complete conversation with participants
    const completeConversation = await Conversation.findByPk(conversation.id, {
      include: [
        {
          model: User,
          as: 'firstParticipant',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: User,
          as: 'secondParticipant',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: Message,
          as: 'lastMessage',
          include: [{
            model: User,
            as: 'sender',
            attributes: ['id', 'firstName', 'lastName'],
          }],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Conversation started successfully',
      data: completeConversation,
    });

  } catch (error) {
    console.error('Start conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;