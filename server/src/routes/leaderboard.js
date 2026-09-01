import { Router } from 'express';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const monthKey = (offset = 0) => {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + offset);
  return d.toISOString().slice(0, 7);
};

router.get('/', requireAuth, async (req, res) => {
  const { branch, section, college, sort = 'composite', limit = 100 } = req.query;
  const filter = {};
  if (branch) filter.branch = branch;
  if (section) filter.section = section;
  if (college) filter.college = college;

  const sortable = {
    composite: { composite: -1 },
    leetcode: { 'platformData.stats.leetcode.solved': -1 },
    codeforces: { 'platformData.stats.codeforces.rating': -1 },
    gfg: { 'platformData.stats.gfg.codingScore': -1 },
    codechef: { 'platformData.stats.codechef.rating': -1 },
    github: { 'platformData.stats.github.publicRepos': -1 },
  };

  const students = await User.find(filter)
    .sort(sortable[sort] || sortable.composite)
    .limit(Math.min(Number(limit) || 100, 500));

  res.json(
    students.map((s, i) => ({
      rank: i + 1,
      id: s._id,
      name: s.name,
      rollNo: s.rollNo,
      branch: s.branch,
      section: s.section,
      college: s.college,
      composite: s.composite,
      breakdown: s.breakdown,
      stats: s.platformData?.stats || {},
    })),
  );
});

/**
 * Monthly Top Performers. Two awards, deliberately separate: the highest absolute
 * composite this month, and the biggest gain over last month's snapshot, so a
 * student who started from nothing can still win something.
 */
router.get('/monthly', requireAuth, async (_req, res) => {
  const thisMonth = monthKey();
  const lastMonth = monthKey(-1);
  const students = await User.find({});

  const rows = students.map((s) => {
    const now = s.history.find((h) => h.month === thisMonth)?.composite ?? s.composite;
    const before = s.history.find((h) => h.month === lastMonth)?.composite ?? null;
    return {
      id: s._id,
      name: s.name,
      rollNo: s.rollNo,
      branch: s.branch,
      section: s.section,
      composite: now,
      delta: before === null ? null : Math.round((now - before) * 100) / 100,
    };
  });

  const byScore = rows.slice().sort((a, b) => b.composite - a.composite);
  const byGain = rows
    .filter((r) => r.delta !== null && r.delta > 0)
    .sort((a, b) => b.delta - a.delta);

  res.json({
    month: thisMonth,
    topPerformer: byScore[0] || null,
    mostImproved: byGain[0] || null,
    top: byScore.slice(0, 10),
    improved: byGain.slice(0, 10),
  });
});

export default router;
