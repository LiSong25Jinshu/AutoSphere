import { DataTypes, Op } from 'sequelize';
import { sequelize } from '../config/database.js';

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  conversationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'conversation_id',
    references: {
      model: 'conversations',
      key: 'id',
    },
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'sender_id',
    references: {
      model: 'users',
      key: 'id',
    },
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [1, 5000],
    },
  },
  messageType: {
    type: DataTypes.ENUM('text', 'image', 'file', 'system'),
    allowNull: false,
    defaultValue: 'text',
    field: 'message_type',
  },
  attachments: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    // Structure: [{ type, url, filename, size }]
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_read',
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'read_at',
  },
  isEdited: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_edited',
  },
  editedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'edited_at',
  },
  replyToId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'reply_to_id',
    references: {
      model: 'messages',
      key: 'id',
    },
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    // Additional metadata like reactions, mentions, etc.
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at',
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'updated_at',
  },
}, {
  tableName: 'messages',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  indexes: [
    {
      fields: ['conversation_id'],
    },
    {
      fields: ['sender_id'],
    },
    {
      fields: ['message_type'],
    },
    {
      fields: ['is_read'],
    },
    {
      fields: ['created_at'],
    },
    {
      fields: ['reply_to_id'],
    },
  ],
});

// Instance methods
Message.prototype.markAsRead = async function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    await this.save();
  }
};

Message.prototype.editContent = async function(newContent) {
  this.content = newContent;
  this.isEdited = true;
  this.editedAt = new Date();
  await this.save();
};

Message.prototype.hasAttachments = function() {
  return this.attachments && this.attachments.length > 0;
};

Message.prototype.isReply = function() {
  return this.replyToId !== null;
};

Message.prototype.toJSON = function() {
  const values = { ...this.get() };
  return values;
};

// Static methods
Message.findByConversation = async function(conversationId, options = {}) {
  return await this.findAll({
    where: { conversationId },
    order: [['createdAt', 'ASC']],
    ...options,
  });
};

Message.findUnreadByUser = async function(userId, options = {}) {
  return await this.findAll({
    where: {
      isRead: false,
    },
    include: [{
      model: sequelize.models.Conversation,
      where: {
        [DataTypes.Op.or]: [
          { participant1: userId },
          { participant2: userId },
        ],
      },
    }],
    ...options,
  });
};

Message.markConversationAsRead = async function(conversationId, userId) {
  return await this.update(
    { 
      isRead: true,
      readAt: new Date(),
    },
    {
      where: {
        conversationId,
        senderId: { [Op.ne]: userId },
        isRead: false,
      },
    }
  );
};

Message.getLastMessage = async function(conversationId) {
  return await this.findOne({
    where: { conversationId },
    order: [['createdAt', 'DESC']],
  });
};

export default Message;