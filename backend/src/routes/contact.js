import express from 'express';
import { body, validationResult } from 'express-validator';
import { sendContactEmail } from '../utils/email.js';

const router = express.Router();

// POST /api/contact - Submit contact form
router.post('/', [
  body('name').notEmpty().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('subject').notEmpty().trim().isLength({ min: 3, max: 200 }).withMessage('Subject must be 3-200 characters'),
  body('message').notEmpty().trim().isLength({ min: 10, max: 2000 }).withMessage('Message must be 10-2000 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { name, email, subject, message } = req.body;

    await sendContactEmail({ name, email, subject, message });

    res.json({
      success: true,
      message: 'Your message has been sent. We\'ll get back to you soon!',
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again later.',
    });
  }
});

export default router;
