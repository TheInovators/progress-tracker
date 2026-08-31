import { get, postJson } from './fetchers/http.js';

const CACHE_MS = 15 * 60 * 1000;
let cache = { at: 0, contests: [] };

const iso = (secondsOrDate) =>
  typeof secondsOrDate === 'number'
    ? new Date(secondsOrDate * 1000).toISOString()
    : new Date(secondsOrDate).toISOString();

async function codeforces() {
  const data = await get('https://codeforces.com/api/contest.list?gym=false', { json: true });
  return (data.result || [])
    .filter((c) => c.phase === 'BEFORE')
    .map((c) => ({
      platform: 'codeforces',
      name: c.name,
      startsAt: iso(c.startTimeSeconds),
      durationMinutes: Math.round(c.durationSeconds / 60),
      url: `https://codeforces.com/contests/${c.id}`,
    }));
}

async function leetcode() {
  const data = await postJson(
    'https://leetcode.com/graphql',
    { query: '{ allContests { title titleSlug startTime duration } }' },
    { headers: { Referer: 'https://leetcode.com/contest/' } },
  );
  const now = Date.now() / 1000;
  return (data?.data?.allContests || [])
    .filter((c) => c.startTime > now)
    .map((c) => ({
      platform: 'leetcode',
      name: c.title,
      startsAt: iso(c.startTime),
      durationMinutes: Math.round(c.duration / 60),
      url: `https://leetcode.com/contest/${c.titleSlug}`,
    }));
}

async function codechef() {
  const data = await get('https://www.codechef.com/api/list/contests/all', { json: true });
  return (data.future_contests || []).map((c) => ({
    platform: 'codechef',
    name: c.contest_name,
    startsAt: iso(c.contest_start_date_iso),
    durationMinutes: Number(c.contest_duration) || 0,
    url: `https://www.codechef.com/${c.contest_code}`,
  }));
}

// GeeksforGeeks publishes no contest feed of any kind, public or internal, so its
// rounds cannot be aggregated here. Left as an explicit no-op rather than a silent
// omission.
async function gfg() {
  return [];
}

/** Merged, time-sorted contest calendar. A dead source drops out quietly. */
export async function upcomingContests({ force = false } = {}) {
  if (!force && Date.now() - cache.at < CACHE_MS) return cache.contests;

  const settled = await Promise.allSettled([codeforces(), leetcode(), codechef(), gfg()]);
  const contests = settled
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => r.value)
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));

  cache = { at: Date.now(), contests };
  return contests;
}
