import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const UserVehicleInteraction = sequelize.define('UserVehicleInteraction', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id'
    },
    vehicleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'vehicle_id'
    },
    interactionType: {
        type: DataTypes.ENUM('view', 'save', 'booking'),
        allowNull: false,
        field: 'interaction_type'
    }
}, {
    tableName: 'user_vehicle_interactions',
    timestamps: true,  // adds createdAt and updatedAt automatically
});

export default UserVehicleInteraction;
