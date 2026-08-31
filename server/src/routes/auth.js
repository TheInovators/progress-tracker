import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import User from '../models/User.js';
import { signToken, requireAuth } from '../middleware/auth.js';

const router = Router();

const makeRollNo = () => `ROLL-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

router.post('/register', async (req, res) => {
  const { name, email, password, branch, section, college, dob, handles } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  if (await User.findOne({ email: String(email).toLowerCase() })) {
    return res.status(409).json({ error: 'That email is already registered' });
  }

  // The first account to register owns the directory; everyone after is a student.
  const isFirstAccount = (await User.estimatedDocumentCount()) === 0;

  const user = await User.create({
    name,
    email,
    passwordHash: await bcrypt.hash(password, 10),
    rollNo: req.body.rollNo?.trim() || makeRollNo(),
    branch: branch || '',
    section: section || '',
    college: college || '',
    dob: dob || null,
    isAdmin: isFirstAccount,
    handles: handles || {},
  });

  res.status(201).json({ token: signToken(user), user: user.toPublic() });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  const user = await User.findOne({ email: String(email || '').toLowerCase() }).select(
    '+passwordHash',
  );
  if (!user || !(await bcrypt.compare(String(password || ''), user.passwordHash))) {
    return res.status(401).json({ error: 'Email or password is incorrect' });
  }
  res.json({ token: signToken(user), user: user.toPublic() });
});

router.get('/me', requireAuth, (req, res) => res.json(req.user.toPublic()));

export default router;
