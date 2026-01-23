import express from 'express';

const router = express.Router();

// Placeholder routes - will be implemented in later tasks
router.get('/', (req, res) => {
  res.status(501).json({ message: 'Get vehicles endpoint - to be implemented' });
});

router.get('/:id', (req, res) => {
  res.status(501).json({ message: 'Get vehicle details endpoint - to be implemented' });
});

router.post('/', (req, res) => {
  res.status(501).json({ message: 'Create vehicle endpoint - to be implemented' });
});

export default router;