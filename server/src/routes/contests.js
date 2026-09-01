import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { upcomingContests } from '../contests.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const { platform, window } = req.query;
  let contests = await upcomingContests({ force: req.query.force === '1' });

  if (platform) {
    const wanted = new Set(String(platform).split(','));
    contests = contests.filter((c) => wanted.has(c.platform));
  }
  if (window === 'week' || window === 'month') {
    const days = window === 'week' ? 7 : 31;
    const cutoff = Date.now() + days * 86400000;
    contests = contests.filter((c) => new Date(c.startsAt).getTime() <= cutoff);
  }

  res.json(contests);
});

export default router;
