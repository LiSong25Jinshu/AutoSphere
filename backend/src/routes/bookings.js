import express from 'express';

const router = express.Router();

// Placeholder routes - will be implemented in later tasks
router.get('/', (req, res) => {
  res.status(501).json({ message: 'Get bookings endpoint - to be implemented' });
});

router.post('/', (req, res) => {
  res.status(501).json({ message: 'Create booking endpoint - to be implemented' });
});

export default router;