import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('message', 'booking', 'system', 'alert'),
    allowNull: false,
    defaultValue: 'system',
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  // Optional link data so the frontend can navigate on click
  linkType: {
    type: DataTypes.STRING(50),
    allowNull: true, // e.g. 'booking', 'conversation'
  },
  linkId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'notifications',
  timestamps: true,
});

export default Notification;
