import express from 'express';
import { sequelize } from '../config/database.js';
import { DataTypes } from 'sequelize';
const router = express.Router();
const Service = sequelize.define('Service', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  price: { type: DataTypes.DECIMAL(10,2) },
  duration: { type: DataTypes.INTEGER },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' }
}, { tableName: 'services', timestamps: true });
router.get('/', async (req, res) => {
  try { const services = await Service.findAll({ where: { isActive: true } }); res.json(services); } catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/', async (req, res) => {
  try { const service = await Service.create(req.body); res.status(201).json(service); } catch (e) { res.status(500).json({ error: e.message }); }
});
export default router;
