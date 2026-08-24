import { DataTypes } from 'sequelize';

export const up = async (queryInterface) => {
  try {
    const tableInfo = await queryInterface.describeTable('vehicles');
    if (!tableInfo.availability_type && !tableInfo.availabilityType) {
      await queryInterface.addColumn('vehicles', 'availability_type', {
        type: DataTypes.ENUM('sale', 'rent', 'both'),
        allowNull: false,
        defaultValue: 'sale',
      });
    }
  } catch (err) {
    console.log('Migration note:', err.message);
  }
};

export const down = async (queryInterface) => {
  try {
    await queryInterface.removeColumn('vehicles', 'availability_type');
  } catch (err) {
    console.log('Migration down note:', err.message);
  }
};
