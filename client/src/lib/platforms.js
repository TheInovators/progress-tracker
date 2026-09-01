// One place that decides how each platform looks and what its headline number is,
// so the directory cards, dashboard and leaderboard never disagree.
export const PLATFORMS = {
  leetcode: {
    label: 'LeetCode',
    colour: '#f0a020',
    headline: (s) => `${s.solved} solved`,
    detail: (s) => `Rank #${s.ranking?.toLocaleString() || '-'} · ${s.easy}E / ${s.medium}M / ${s.hard}H`,
  },
  codeforces: {
    label: 'Codeforces',
    colour: '#3b82f6',
    headline: (s) => `${s.rating} rating`,
    detail: (s) => `${s.rank} · max ${s.maxRating} · ${s.contests} contests`,
  },
  gfg: {
    label: 'GeeksforGeeks',
    colour: '#22c55e',
    headline: (s) => `${s.codingScore} score`,
    detail: (s) => `${s.problemsSolved} solved · institute rank ${s.instituteRank || '-'}`,
  },
  codechef: {
    label: 'CodeChef',
    colour: '#a855f7',
    headline: (s) => `${s.rating} rating`,
    detail: (s) => `${'★'.repeat(s.stars || 0) || 'unrated'} · ${s.problemsSolved} solved`,
  },
  github: {
    label: 'GitHub',
    colour: '#e2e8f0',
    headline: (s) => `${s.publicRepos} repos`,
    detail: (s) => `${s.followers.toLocaleString()} followers · ${s.stars.toLocaleString()} stars`,
  },
};

export const PLATFORM_KEYS = Object.keys(PLATFORMS);
