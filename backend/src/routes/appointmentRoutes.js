import express from 'express';
import { sequelize } from '../config/database.js';
import { DataTypes } from 'sequelize';
const router = express.Router();
const Appointment = sequelize.define('Appointment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
  providerId: { type: DataTypes.INTEGER, allowNull: false, field: 'provider_id' },
  serviceType: { type: DataTypes.STRING, allowNull: false, field: 'service_type' },
  status: { type: DataTypes.STRING, defaultValue: 'pending' },
  appointmentDate: { type: DataTypes.DATE, allowNull: false, field: 'appointment_date' },
  appointmentTime: { type: DataTypes.TIME, allowNull: false, field: 'appointment_time' },
  notes: { type: DataTypes.TEXT, allowNull: true },
  price: { type: DataTypes.DECIMAL(10,2), allowNull: true }
}, { tableName: 'appointments', timestamps: true });
router.get('/', async (req, res) => {
  try { const appointments = await Appointment.findAll(); res.json(appointments); } catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/', async (req, res) => {
  try { const appointment = await Appointment.create(req.body); res.status(201).json(appointment); } catch (e) { res.status(500).json({ error: e.message }); }
});
export default router;
