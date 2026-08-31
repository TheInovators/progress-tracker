import { fetchLeetcode } from './leetcode.js';
import { fetchCodeforces } from './codeforces.js';
import { fetchGfg } from './gfg.js';
import { fetchCodechef } from './codechef.js';
import { fetchGithub } from './github.js';

const FETCHERS = {
  leetcode: fetchLeetcode,
  codeforces: fetchCodeforces,
  gfg: fetchGfg,
  codechef: fetchCodechef,
  github: fetchGithub,
};

export const PLATFORMS = Object.keys(FETCHERS);

// Fetches every platform the student has a username for, in parallel. A platform
// that fails records its error instead of failing the whole refresh, because one
// dead scraper must not blank out the other four.
export async function fetchAllPlatforms(handles = {}) {
  const wanted = PLATFORMS.filter((p) => handles[p]);
  const settled = await Promise.allSettled(wanted.map((p) => FETCHERS[p](handles[p])));

  const stats = {};
  const errors = {};
  wanted.forEach((platform, i) => {
    const result = settled[i];
    if (result.status === 'fulfilled') stats[platform] = result.value;
    else errors[platform] = result.reason?.message || String(result.reason);
  });

  return { stats, errors, fetchedAt: new Date() };
}
