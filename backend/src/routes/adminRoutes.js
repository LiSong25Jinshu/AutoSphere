import express from "express";
import User from "../models/User.js";
const router = express.Router();
router.get("/users", async (req, res) => {
  try {
    const users = await User.findAll({ attributes: { exclude: ["passwordHash"] } });
    res.json(users);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.put("/users/:id/status", async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    await user.update({ isActive: req.body.isActive });
    res.json({ message: "Status updated" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
export default router;
