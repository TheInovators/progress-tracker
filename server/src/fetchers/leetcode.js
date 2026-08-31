import { postJson } from './http.js';

const QUERY = `
query userStats($u: String!) {
  matchedUser(username: $u) {
    username
    profile { ranking reputation realName countryName }
    submitStatsGlobal { acSubmissionNum { difficulty count } }
    badges { displayName }
  }
  userContestRanking(username: $u) { rating globalRanking attendedContestsCount topPercentage }
}`;

export async function fetchLeetcode(username) {
  const data = await postJson(
    'https://leetcode.com/graphql',
    { query: QUERY, variables: { u: username } },
    { headers: { Referer: 'https://leetcode.com' } },
  );
  const user = data?.data?.matchedUser;
  if (!user) throw new Error('leetcode: user not found');

  const byDifficulty = {};
  for (const row of user.submitStatsGlobal?.acSubmissionNum || []) {
    byDifficulty[row.difficulty.toLowerCase()] = row.count;
  }
  const contest = data?.data?.userContestRanking;

  return {
    username: user.username,
    solved: byDifficulty.all ?? 0,
    easy: byDifficulty.easy ?? 0,
    medium: byDifficulty.medium ?? 0,
    hard: byDifficulty.hard ?? 0,
    ranking: user.profile?.ranking ?? 0,
    reputation: user.profile?.reputation ?? 0,
    contestRating: Math.round(contest?.rating ?? 0),
    contestsAttended: contest?.attendedContestsCount ?? 0,
    badges: (user.badges || []).map((b) => b.displayName),
  };
}
