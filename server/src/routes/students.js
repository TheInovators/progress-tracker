import { Router } from 'express';
import User from '../models/User.js';
import { requireAuth, requireAdmin, requireSelfOrAdmin } from '../middleware/auth.js';
import { fetchAllPlatforms, PLATFORMS } from '../fetchers/index.js';
import { computeScore } from '../score.js';

const router = Router();
const TTL_MS = Number(process.env.STATS_TTL_MINUTES || 60) * 60 * 1000;

const currentMonth = () => new Date().toISOString().slice(0, 7);

/**
 * Pulls every linked platform, rescores the student, and appends a snapshot for
 * the current month. Snapshots are replaced rather than appended within a month
 * so a student refreshing ten times a day does not skew the monthly delta.
 */
async function refreshStudent(user) {
  const { stats, errors, fetchedAt } = await fetchAllPlatforms(
    user.handles.toObject?.() ?? user.handles,
  );
  const { composite, breakdown } = computeScore(stats);

  user.platformData = { stats, fetchErrors: errors, fetchedAt };
  user.composite = composite;
  user.breakdown = breakdown;

  const month = currentMonth();
  const existing = user.history.find((h) => h.month === month);
  if (existing) {
    existing.composite = composite;
    existing.takenAt = new Date();
  } else {
    user.history.push({ month, composite });
  }

  await user.save();
  return user;
}

// Directory. Filtering is also supported server side so the grid still works once
// the college outgrows the client-side filter the deck describes.
router.get('/', requireAuth, async (req, res) => {
  const { branch, section, college, q } = req.query;
  const filter = {};
  const inList = (v) => ({ $in: String(v).split(',').map((s) => s.trim()).filter(Boolean) });
  if (branch) filter.branch = inList(branch);
  if (section) filter.section = inList(section);
  if (college) filter.college = inList(college);
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { rollNo: { $regex: q, $options: 'i' } },
    ];
  }

  const [students, total] = await Promise.all([
    User.find(filter).sort({ composite: -1, name: 1 }),
    User.estimatedDocumentCount(),
  ]);

  res.json({ students: students.map((s) => s.toPublic()), matched: students.length, total });
});

// Distinct values that populate the filter dropdowns.
router.get('/facets', requireAuth, async (_req, res) => {
  const [branches, sections, colleges] = await Promise.all([
    User.distinct('branch'),
    User.distinct('section'),
    User.distinct('college'),
  ]);
  const clean = (list) => list.filter(Boolean).sort();
  res.json({ branches: clean(branches), sections: clean(sections), colleges: clean(colleges) });
});

router.get('/:id', requireAuth, async (req, res) => {
  const student = await User.findById(req.params.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  res.json(student.toPublic());
});

router.patch('/:id', requireAuth, requireSelfOrAdmin, async (req, res) => {
  const student = await User.findById(req.params.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  for (const field of ['name', 'branch', 'section', 'college']) {
    if (req.body[field] !== undefined) student[field] = req.body[field];
  }
  if (req.body.handles) {
    for (const p of PLATFORMS) {
      if (req.body.handles[p] !== undefined) student.handles[p] = req.body.handles[p].trim();
    }
  }
  // Date of birth is write-once for everyone, admins included.
  if (req.body.dob !== undefined) {
    if (student.dob) return res.status(409).json({ error: 'Date of birth is locked once set' });
    student.dob = req.body.dob;
  }
  // Only an admin can hand out admin.
  if (req.body.isAdmin !== undefined && req.user.isAdmin) student.isAdmin = !!req.body.isAdmin;

  await student.save();
  res.json(student.toPublic());
});

router.post('/:id/refresh', requireAuth, requireSelfOrAdmin, async (req, res) => {
  const student = await User.findById(req.params.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const fresh = student.platformData?.fetchedAt;
  if (fresh && Date.now() - new Date(fresh).getTime() < TTL_MS && !req.query.force) {
    return res.json({ student: student.toPublic(), cached: true });
  }

  await refreshStudent(student);
  res.json({ student: student.toPublic(), cached: false });
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const deleted = await User.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Student not found' });
  res.json({ deleted: 1 });
});

// Bulk delete backing the checkbox multi-select on the directory grid.
router.post('/bulk-delete', requireAuth, requireAdmin, async (req, res) => {
  const ids = (req.body?.ids || []).filter((id) => String(id) !== String(req.user._id));
  if (!ids.length) return res.status(400).json({ error: 'No deletable ids supplied' });
  const { deletedCount } = await User.deleteMany({ _id: { $in: ids } });
  res.json({ deleted: deletedCount });
});

export { refreshStudent };
export default router;
