import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const ProviderSchedule = sequelize.define('ProviderSchedule', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  providerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    field: 'provider_id',
  },
  // Store schedule as JSON: { Monday: { enabled, start, end }, ... }
  schedule: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {},
  },
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
  updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'updated_at' },
}, {
  tableName: 'provider_schedules',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
});

export default ProviderSchedule;
