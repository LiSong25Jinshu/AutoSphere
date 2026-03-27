import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const SavedSearch = sequelize.define('SavedSearch', {
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
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  searchCriteria: {
    type: DataTypes.JSON,
    allowNull: false,
    field: 'search_criteria',
    // Structure: { make, model, minYear, maxYear, minPrice, maxPrice, etc. }
  },
  notificationsEnabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'notifications_enabled',
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
  tableName: 'saved_searches',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  indexes: [
    {
      fields: ['user_id'],
    },
  ],
});

export default SavedSearch;
