// Weights come straight from the Platform Score System slide. They are exported so
// an institute can retune them without touching the normalisation below.
export const WEIGHTS = {
  leetcode: 0.25,
  codeforces: 0.2,
  gfg: 0.2,
  codechef: 0.15,
  github: 0.2,
};

const clamp = (v) => Math.max(0, Math.min(1, v));
const band = (value, floor, ceiling) => clamp((value - floor) / (ceiling - floor));

// Each platform measures something different, so every raw stat is first mapped to
// a 0-100 strength before the weights are applied. Otherwise a 3500 Codeforces
// rating would drown out a 400-problem LeetCode record.
export const NORMALISERS = {
  leetcode: (s) =>
    100 * clamp((s.easy * 1 + s.medium * 2.5 + s.hard * 5) / 2500),
  codeforces: (s) => 100 * band(s.rating, 800, 3000),
  gfg: (s) => 100 * clamp((s.codingScore + s.problemsSolved * 2) / 2000),
  codechef: (s) => 100 * band(s.rating, 1000, 2500),
  github: (s) =>
    100 * clamp((s.publicRepos * 3 + s.followers * 0.5 + Math.log10(1 + s.stars) * 10) / 150),
};

/**
 * Turns a stats bundle into one comparable number.
 * Returns the composite (0-100) plus the per-platform breakdown the dashboard
 * charts. Platforms the student has not linked score 0 and still consume their
 * weight, so linking a fifth platform can only ever raise the composite.
 */
export function computeScore(stats = {}, weights = WEIGHTS) {
  const breakdown = {};
  let composite = 0;

  for (const [platform, weight] of Object.entries(weights)) {
    const raw = stats[platform];
    const strength = raw ? Math.round(NORMALISERS[platform](raw) * 100) / 100 : 0;
    breakdown[platform] = { strength, weight, points: Math.round(strength * weight * 100) / 100 };
    composite += strength * weight;
  }

  return { composite: Math.round(composite * 100) / 100, breakdown };
}
