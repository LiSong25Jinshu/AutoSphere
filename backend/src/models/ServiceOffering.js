import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const ServiceOffering = sequelize.define('ServiceOffering', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  providerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'provider_id',
  },
  name: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  category: {
    type: DataTypes.ENUM('car_wash', 'maintenance', 'repair', 'other'),
    allowNull: false,
    defaultValue: 'maintenance',
  },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  duration: { type: DataTypes.INTEGER, allowNull: false, comment: 'Duration in minutes' },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_active' },
  bookingCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'booking_count' },
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
  updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'updated_at' },
}, {
  tableName: 'service_offerings',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
});

export default ServiceOffering;
