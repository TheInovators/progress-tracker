import { Router } from 'express';
import Message from '../models/Message.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Backfill so a client that just connected sees the conversation it joined.
router.get('/:room', requireAuth, async (req, res) => {
  const messages = await Message.find({ room: req.params.room })
    .sort({ createdAt: -1 })
    .limit(100);
  res.json(messages.reverse());
});

export default router;
