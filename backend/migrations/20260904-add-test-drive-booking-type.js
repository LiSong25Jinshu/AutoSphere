export const up = async (queryInterface) => {
  if (queryInterface.sequelize.getDialect() !== 'postgres') return;

  await queryInterface.sequelize.query(
    "ALTER TYPE \"enum_bookings_service_type\" ADD VALUE IF NOT EXISTS 'test_drive'"
  );
};

export const down = async () => {
  // PostgreSQL enum values cannot be removed safely without rebuilding the type.
};
