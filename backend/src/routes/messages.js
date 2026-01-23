import express from 'express';

const router = express.Router();

// Placeholder routes - will be implemented in later tasks
router.get('/conversations', (req, res) => {
  res.status(501).json({ message: 'Get conversations endpoint - to be implemented' });
});

router.post('/', (req, res) => {
  res.status(501).json({ message: 'Send message endpoint - to be implemented' });
});

export default router;