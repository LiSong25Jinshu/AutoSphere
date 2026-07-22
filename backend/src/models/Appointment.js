import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Appointment = sequelize.define('Appointment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
  providerId: { type: DataTypes.INTEGER, allowNull: false, field: 'provider_id' },
  serviceType: { type: DataTypes.ENUM('maintenance', 'repair', 'carWash', 'detailing', 'inspection'), allowNull: false, field: 'service_type' },
  status: { type: DataTypes.ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled'), defaultValue: 'pending' },
  appointmentDate: { type: DataTypes.DATE, allowNull: false, field: 'appointment_date' },
  appointmentTime: { type: DataTypes.TIME, allowNull: false, field: 'appointment_time' },
  notes: { type: DataTypes.TEXT, allowNull: true },
  price: { type: DataTypes.DECIMAL(10,2), allowNull: true }
}, { tableName: 'appointments', timestamps: true });

Appointment.associate = (models) => {
  Appointment.belongsTo(models.User, { as: 'user', foreignKey: 'userId' });
  Appointment.belongsTo(models.User, { as: 'provider', foreignKey: 'providerId' });
};
export default Appointment;
