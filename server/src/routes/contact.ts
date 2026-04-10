import { Router } from 'express';
import { z } from 'zod';
import { ContactMessage } from '../models/ContactMessage.js';
import { sendContactNotification } from '../services/email.js';

const router = Router();

const contactSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  company: z.string().default(''),
  email: z.string().email('Valid email is required'),
  phone: z.string().default(''),
  message: z.string().min(1, 'Message is required'),
});

router.post('/', async (req, res, next) => {
  try {
    const data = contactSchema.parse(req.body);
    const msg = await ContactMessage.create(data);

    sendContactNotification(data).catch((err) =>
      console.error('Email send failed:', err),
    );

    res.status(201).json({ success: true, id: msg._id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0]?.message });
      return;
    }
    next(err);
  }
});

export default router;
