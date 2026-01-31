import { DataTypes, Op } from 'sequelize';
import { sequelize } from '../config/database.js';

const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  participant1: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  participant2: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  conversationType: {
    type: DataTypes.ENUM('direct', 'support', 'booking_related'),
    allowNull: false,
    defaultValue: 'direct',
    field: 'conversation_type',
  },
  relatedBookingId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'related_booking_id',
    references: {
      model: 'bookings',
      key: 'id',
    },
  },
  relatedVehicleId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'related_vehicle_id',
    references: {
      model: 'vehicles',
      key: 'id',
    },
  },
  status: {
    type: DataTypes.ENUM('active', 'archived', 'blocked'),
    allowNull: false,
    defaultValue: 'active',
  },
  lastMessageAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_message_at',
  },
  lastMessageId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'last_message_id',
    references: {
      model: 'messages',
      key: 'id',
    },
  },
  unreadCount1: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'unread_count_1',
    // Unread count for participant1
  },
  unreadCount2: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'unread_count_2',
    // Unread count for participant2
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    // Additional metadata like muted status, custom settings, etc.
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
  tableName: 'conversations',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  indexes: [
    {
      fields: ['participant1'],
    },
    {
      fields: ['participant2'],
    },
    {
      unique: true,
      fields: ['participant1', 'participant2'],
      name: 'unique_conversation_participants',
    },
    {
      fields: ['conversation_type'],
    },
    {
      fields: ['status'],
    },
    {
      fields: ['last_message_at'],
    },
    {
      fields: ['related_booking_id'],
    },
    {
      fields: ['related_vehicle_id'],
    },
  ],
});

// Instance methods
Conversation.prototype.getOtherParticipant = function(userId) {
  return this.participant1 === userId ? this.participant2 : this.participant1;
};

Conversation.prototype.getUnreadCount = function(userId) {
  return this.participant1 === userId ? this.unreadCount1 : this.unreadCount2;
};

Conversation.prototype.updateLastMessage = async function(messageId) {
  this.lastMessageId = messageId;
  this.lastMessageAt = new Date();
  await this.save();
};

Conversation.prototype.incrementUnreadCount = async function(forUserId) {
  if (this.participant1 === forUserId) {
    this.unreadCount1 += 1;
  } else if (this.participant2 === forUserId) {
    this.unreadCount2 += 1;
  }
  await this.save();
};

Conversation.prototype.resetUnreadCount = async function(forUserId) {
  if (this.participant1 === forUserId) {
    this.unreadCount1 = 0;
  } else if (this.participant2 === forUserId) {
    this.unreadCount2 = 0;
  }
  await this.save();
};

Conversation.prototype.archive = async function() {
  this.status = 'archived';
  await this.save();
};

Conversation.prototype.block = async function() {
  this.status = 'blocked';
  await this.save();
};

Conversation.prototype.unarchive = async function() {
  this.status = 'active';
  await this.save();
};

Conversation.prototype.toJSON = function() {
  const values = { ...this.get() };
  return values;
};

// Static methods
Conversation.findByParticipants = async function(userId1, userId2) {
  return await this.findOne({
    where: {
      [Op.or]: [
        { participant1: userId1, participant2: userId2 },
        { participant1: userId2, participant2: userId1 },
      ],
    },
  });
};

Conversation.findOrCreateByParticipants = async function(userId1, userId2, options = {}) {
  let conversation = await this.findByParticipants(userId1, userId2);
  
  if (!conversation) {
    conversation = await this.create({
      participant1: Math.min(userId1, userId2), // Ensure consistent ordering
      participant2: Math.max(userId1, userId2),
      ...options,
    });
  }
  
  return conversation;
};

Conversation.findByUser = async function(userId, options = {}) {
  return await this.findAll({
    where: {
      [Op.or]: [
        { participant1: userId },
        { participant2: userId },
      ],
      status: 'active',
    },
    order: [['lastMessageAt', 'DESC']],
    ...options,
  });
};

Conversation.findByBooking = async function(bookingId, options = {}) {
  return await this.findAll({
    where: { relatedBookingId: bookingId },
    ...options,
  });
};

Conversation.findByVehicle = async function(vehicleId, options = {}) {
  return await this.findAll({
    where: { relatedVehicleId: vehicleId },
    ...options,
  });
};

export default Conversation;