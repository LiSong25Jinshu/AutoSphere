'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create table only if it doesn't already exist
    const tables = await queryInterface.showAllTables();
    if (tables.includes('favorite_vehicles')) return;

    await queryInterface.createTable('favorite_vehicles', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      vehicle_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'vehicles', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Unique constraint — a user can only favourite a vehicle once
    await queryInterface.addIndex('favorite_vehicles', ['user_id', 'vehicle_id'], {
      unique: true,
      name: 'favorite_vehicles_user_vehicle_unique',
    });

    await queryInterface.addIndex('favorite_vehicles', ['user_id'], {
      name: 'favorite_vehicles_user_id_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('favorite_vehicles');
  },
};
