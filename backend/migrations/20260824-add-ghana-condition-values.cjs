module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(
      "ALTER TYPE \"enum_vehicles_condition\" ADD VALUE IF NOT EXISTS 'foreign_used';"
    );
    await queryInterface.sequelize.query(
      "ALTER TYPE \"enum_vehicles_condition\" ADD VALUE IF NOT EXISTS 'local_used';"
    );
  },
  down: async () => {
    // Postgres doesn't support removing enum values directly — no-op.
  },
};