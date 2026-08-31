import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Judge0 language ids for the three languages the deck names.
const LANGUAGES = { python: 71, cpp: 54, java: 62 };

const judge0 = () => (process.env.JUDGE0_URL || 'https://ce.judge0.com').replace(/\/$/, '');

const judgeHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  if (process.env.JUDGE0_RAPIDAPI_KEY) {
    headers['X-RapidAPI-Key'] = process.env.JUDGE0_RAPIDAPI_KEY;
    headers['X-RapidAPI-Host'] = new URL(judge0()).host;
  }
  return headers;
};

router.get('/languages', requireAuth, (_req, res) => res.json(Object.keys(LANGUAGES)));

router.post('/', requireAuth, async (req, res) => {
  const { language, source, stdin = '' } = req.body || {};
  const languageId = LANGUAGES[language];
  if (!languageId) return res.status(400).json({ error: 'Unsupported language' });
  if (typeof source !== 'string' || !source.trim()) {
    return res.status(400).json({ error: 'Source code is required' });
  }
  if (source.length > 64_000) return res.status(413).json({ error: 'Source code is too large' });

  try {
    // wait=true blocks until the submission finishes, which keeps the client a
    // single request instead of a polling loop.
    const response = await fetch(`${judge0()}/submissions?base64_encoded=false&wait=true`, {
      method: 'POST',
      headers: judgeHeaders(),
      body: JSON.stringify({ language_id: languageId, source_code: source, stdin }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      return res
        .status(502)
        .json({ error: `Judge0 returned HTTP ${response.status}. Check JUDGE0_URL and any API key.` });
    }

    const result = await response.json();
    res.json({
      status: result.status?.description || 'Unknown',
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      compileOutput: result.compile_output || '',
      timeSeconds: result.time,
      memoryKb: result.memory,
    });
  } catch (err) {
    res.status(504).json({ error: `Could not reach Judge0: ${err.message}` });
  }
});

export default router;
