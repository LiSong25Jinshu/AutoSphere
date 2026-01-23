import express from 'express';

const router = express.Router();

// Placeholder routes - will be implemented in later tasks
router.get('/profile', (req, res) => {
  res.status(501).json({ message: 'Get profile endpoint - to be implemented' });
});

router.put('/profile', (req, res) => {
  res.status(501).json({ message: 'Update profile endpoint - to be implemented' });
});

export default router;