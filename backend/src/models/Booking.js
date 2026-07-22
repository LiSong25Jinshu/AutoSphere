import { DataTypes, Op } from 'sequelize';
import { sequelize } from '../config/database.js';

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id',
    },
  },
  serviceProviderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'service_provider_id',
    references: {
      model: 'users',
      key: 'id',
    },
  },
  vehicleId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'vehicle_id',
    references: {
      model: 'vehicles',
      key: 'id',
    },
  },
  serviceType: {
    type: DataTypes.ENUM(
      'carwash',
      'oil_change',
      'brake_service',
      'tire_service',
      'engine_diagnostic',
      'transmission_service',
      'air_conditioning',
      'battery_service',
      'general_maintenance',
      'inspection',
      'repair',
      'other'
    ),
    allowNull: false,
    field: 'service_type',
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      len: [5, 200],
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  scheduledDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'scheduled_date',
  },
  scheduledTime: {
    type: DataTypes.TIME,
    allowNull: false,
    field: 'scheduled_time',
  },
  estimatedDuration: {
    type: DataTypes.INTEGER, // in minutes
    allowNull: true,
    field: 'estimated_duration',
    validate: {
      min: 15,
      max: 480, // 8 hours max
    },
  },
  estimatedCost: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    field: 'estimated_cost',
    validate: {
      min: 0,
    },
  },
  actualCost: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    field: 'actual_cost',
    validate: {
      min: 0,
    },
  },
  status: {
    type: DataTypes.ENUM(
      'pending',
      'confirmed',
      'in_progress',
      'completed',
      'cancelled',
      'no_show'
    ),
    allowNull: false,
    defaultValue: 'pending',
  },
  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
    allowNull: false,
    defaultValue: 'normal',
  },
  customerNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'customer_notes',
  },
  providerNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'provider_notes',
  },
  location: {
    type: DataTypes.JSON,
    allowNull: true,
    // Structure: { address, city, state, zipCode, coordinates: { lat, lng } }
  },
  contactInfo: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'contact_info',
    // Structure: { phone, email, preferredContact }
  },
  reminderSent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'reminder_sent',
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'completed_at',
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'cancelled_at',
  },
  cancellationReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'cancellation_reason',
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5,
    },
  },
  review: {
    type: DataTypes.TEXT,
    allowNull: true,
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
  tableName: 'bookings',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  indexes: [
    {
      fields: ['user_id'],
    },
    {
      fields: ['service_provider_id'],
    },
    {
      fields: ['vehicle_id'],
    },
    {
      fields: ['service_type'],
    },
    {
      fields: ['status'],
    },
    {
      fields: ['scheduled_date'],
    },
    {
      fields: ['priority'],
    },
    {
      fields: ['created_at'],
    },
  ],
});

// Instance methods
Booking.prototype.isPending = function() {
  return this.status === 'pending';
};

Booking.prototype.isConfirmed = function() {
  return this.status === 'confirmed';
};

Booking.prototype.isCompleted = function() {
  return this.status === 'completed';
};

Booking.prototype.isCancelled = function() {
  return this.status === 'cancelled';
};

Booking.prototype.canBeCancelled = function() {
  return ['pending', 'confirmed'].includes(this.status);
};

Booking.prototype.canBeRescheduled = function() {
  return ['pending', 'confirmed'].includes(this.status);
};

Booking.prototype.markAsCompleted = async function() {
  this.status = 'completed';
  this.completedAt = new Date();
  await this.save();
};

Booking.prototype.cancel = async function(reason = null) {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  if (reason) {
    this.cancellationReason = reason;
  }
  await this.save();
};

Booking.prototype.confirm = async function() {
  this.status = 'confirmed';
  await this.save();
};

Booking.prototype.reschedule = async function(newDate, newTime) {
  this.scheduledDate = newDate;
  this.scheduledTime = newTime;
  await this.save();
};

Booking.prototype.addRating = async function(rating, review = null) {
  this.rating = rating;
  if (review) {
    this.review = review;
  }
  await this.save();
};

Booking.prototype.toJSON = function() {
  const values = { ...this.get() };
  return values;
};

// Static methods
Booking.findByUser = async function(userId, options = {}) {
  return await this.findAll({
    where: { userId },
    order: [['scheduledDate', 'DESC']],
    ...options,
  });
};

Booking.findByServiceProvider = async function(serviceProviderId, options = {}) {
  return await this.findAll({
    where: { serviceProviderId },
    order: [['scheduledDate', 'ASC']],
    ...options,
  });
};

Booking.findUpcoming = async function(userId, options = {}) {
  const now = new Date();
  return await this.findAll({
    where: {
      userId,
      scheduledDate: {
        [Op.gte]: now,
      },
      status: {
        [Op.in]: ['pending', 'confirmed'],
      },
    },
    order: [['scheduledDate', 'ASC']],
    ...options,
  });
};

Booking.findByStatus = async function(status, options = {}) {
  return await this.findAll({
    where: { status },
    order: [['scheduledDate', 'ASC']],
    ...options,
  });
};

Booking.findByDateRange = async function(startDate, endDate, options = {}) {
  return await this.findAll({
    where: {
      scheduledDate: {
        [Op.between]: [startDate, endDate],
      },
    },
    order: [['scheduledDate', 'ASC']],
    ...options,
  });
};

export default Booking;