'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      const tableInfo = await queryInterface.describeTable('users');
      if (!tableInfo.approval_status) {
        await queryInterface.addColumn('users', 'approval_status', {
          type: Sequelize.ENUM('pending', 'approved', 'rejected'),
          allowNull: false,
          defaultValue: 'approved', // existing accounts stay accessible
        });
        // Dealers and service providers registered via /register-provider start as 'pending'
        await queryInterface.sequelize.query(`
          UPDATE users
          SET approval_status = 'pending'
          WHERE role IN ('dealer', 'service_provider')
            AND approval_status = 'approved'
        `);
      }
    } catch (err) {
      console.log('Migration 20260907 note:', err.message);
    }
  },

  async down(queryInterface) {
    try {
      await queryInterface.removeColumn('users', 'approval_status');
    } catch (err) {
      console.log('Migration 20260907 down note:', err.message);
    }
  },
};
