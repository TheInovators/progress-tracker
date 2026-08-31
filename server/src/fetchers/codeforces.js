import { get } from './http.js';

// Codeforces publishes a documented public API, so no scraping is needed here.
export async function fetchCodeforces(handle) {
  const info = await get(
    `https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`,
    { json: true },
  );
  if (info.status !== 'OK' || !info.result?.length) throw new Error('codeforces: user not found');
  const u = info.result[0];

  let history = [];
  try {
    const rating = await get(
      `https://codeforces.com/api/user.rating?handle=${encodeURIComponent(handle)}`,
      { json: true },
    );
    history = (rating.result || []).map((c) => ({
      contest: c.contestName,
      rank: c.rank,
      rating: c.newRating,
      at: new Date(c.ratingUpdateTimeSeconds * 1000).toISOString(),
    }));
  } catch {
    history = [];
  }

  return {
    handle: u.handle,
    rating: u.rating ?? 0,
    maxRating: u.maxRating ?? 0,
    rank: u.rank ?? 'unrated',
    maxRank: u.maxRank ?? 'unrated',
    contribution: u.contribution ?? 0,
    friendOfCount: u.friendOfCount ?? 0,
    contests: history.length,
    ratingHistory: history,
  };
}
