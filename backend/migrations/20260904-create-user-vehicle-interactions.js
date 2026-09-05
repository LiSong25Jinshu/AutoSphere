import { DataTypes } from 'sequelize';

export const up = async (queryInterface) => {
  const tables = await queryInterface.showAllTables();
  if (tables.includes('user_vehicle_interactions')) return;

  await queryInterface.createTable('user_vehicle_interactions', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    vehicle_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'vehicles', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    interaction_type: {
      type: DataTypes.ENUM('view', 'save', 'booking'),
      allowNull: false,
    },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });

  await queryInterface.addIndex('user_vehicle_interactions', ['user_id', 'vehicle_id', 'interaction_type'], {
    unique: true,
    name: 'user_vehicle_interactions_unique_save',
  });
};

export const down = async (queryInterface) => {
  await queryInterface.dropTable('user_vehicle_interactions');
};
