import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const UserVehicleInteraction = sequelize.define('UserVehicleInteraction', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    interactionType: {
        type: DataTypes.ENUM('view', 'save', 'booking'),
        allowNull: false
    }
}, {
    tableName: 'user_vehicle_interactions';
    timestamps: true,  // adds createdAt and updatedAt automatically
});

export default UserVehicleInteraction;