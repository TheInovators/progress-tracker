import { get, num } from './http.js';

// GeeksforGeeks renders profiles with the Next.js app router. There is no public
// API, so this reads the streamed RSC payload embedded in the page. Falls back to
// zeros per field if the payload shape changes.
export async function fetchGfg(username) {
  const html = await get(`https://www.geeksforgeeks.org/user/${encodeURIComponent(username)}/`);
  if (/<title>undefined/i.test(html)) throw new Error('gfg: user not found');

  const pick = (key) => {
    const m = html.match(new RegExp(`\\\\"${key}\\\\":\\s*(\\\\"[^"\\\\]*\\\\"|[\\d.]+)`));
    if (!m) return '';
    return m[1].replace(/\\"/g, '').trim();
  };

  return {
    username,
    codingScore: num(pick('score')),
    monthlyScore: num(pick('monthly_score')),
    problemsSolved: num(pick('total_problems_solved')),
    instituteRank: num(pick('institute_rank')),
    currentStreak: num(pick('pod_solved_current_streak')),
    longestStreak: num(pick('pod_solved_longest_streak')),
    institute: pick('institute_name'),
  };
}
