'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('users');

    // consent_data — GDPR consent record (marketing, analytics, functional)
    if (!tableDescription.consent_data) {
      await queryInterface.addColumn('users', 'consent_data', {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'consent_data');
  },
};
