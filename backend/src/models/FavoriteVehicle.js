import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const FavoriteVehicle = sequelize.define('FavoriteVehicle', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: { model: 'users', key: 'id' },
  },
  vehicleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'vehicle_id',
    references: { model: 'vehicles', key: 'id' },
  },
}, {
  tableName: 'favorite_vehicles',
  timestamps: true,
  indexes: [
    { fields: ['user_id'] },
    { unique: true, fields: ['user_id', 'vehicle_id'] },
  ],
});

export default FavoriteVehicle;
