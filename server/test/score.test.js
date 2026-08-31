import test from 'node:test';
import assert from 'node:assert/strict';
import { computeScore, WEIGHTS } from '../src/score.js';

const full = {
  leetcode: { easy: 500, medium: 500, hard: 500 },
  codeforces: { rating: 3000 },
  gfg: { codingScore: 2000, problemsSolved: 500 },
  codechef: { rating: 2500 },
  github: { publicRepos: 50, followers: 100, stars: 10000 },
};

test('a maxed-out profile saturates at 100', () => {
  assert.equal(computeScore(full).composite, 100);
});

test('an empty profile scores 0', () => {
  assert.equal(computeScore({}).composite, 0);
});

test('weights sum to 1 so the composite stays on a 0-100 scale', () => {
  const total = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(total - 1) < 1e-9);
});

test('a missing platform costs exactly its weight, never more', () => {
  const { github, ...withoutGithub } = full;
  const { composite } = computeScore(withoutGithub);
  assert.equal(composite, 100 - WEIGHTS.github * 100);
});

test('ratings below the floor clamp to zero instead of going negative', () => {
  const { breakdown } = computeScore({ codeforces: { rating: 400 } });
  assert.equal(breakdown.codeforces.strength, 0);
});

test('a harder problem mix outscores an easy one at equal volume', () => {
  const easy = computeScore({ leetcode: { easy: 300, medium: 0, hard: 0 } }).composite;
  const hard = computeScore({ leetcode: { easy: 0, medium: 0, hard: 300 } }).composite;
  assert.ok(hard > easy);
});
