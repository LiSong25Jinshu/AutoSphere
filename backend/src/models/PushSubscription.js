import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

// Stores browser push subscriptions per user.
// A user can have multiple subscriptions (different browsers/devices).
const PushSubscription = sequelize.define('PushSubscription', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
  },
  endpoint: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true,
  },
  // JSON: { p256dh, auth }
  keys: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  userAgent: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'user_agent',
  },
}, {
  tableName: 'push_subscriptions',
  timestamps: true,
});

export default PushSubscription;
