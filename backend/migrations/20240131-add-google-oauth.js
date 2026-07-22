import { DataTypes } from 'sequelize';

export const up = async (queryInterface) => {
  await queryInterface.addColumn('users', 'google_id', {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true,
  });

  // Make password_hash nullable for Google OAuth users
  await queryInterface.changeColumn('users', 'password_hash', {
    type: DataTypes.STRING(255),
    allowNull: true,
  });

  // Add index for google_id
  await queryInterface.addIndex('users', ['google_id'], {
    unique: true,
    where: {
      google_id: {
        [DataTypes.Op.ne]: null
      }
    }
  });
};

export const down = async (queryInterface) => {
  await queryInterface.removeColumn('users', 'google_id');
  
  // Revert password_hash to not nullable (this might fail if there are Google OAuth users)
  await queryInterface.changeColumn('users', 'password_hash', {
    type: DataTypes.STRING(255),
    allowNull: false,
  });
};