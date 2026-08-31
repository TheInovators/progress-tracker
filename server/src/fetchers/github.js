import { get } from './http.js';

const auth = () =>
  process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {};

export async function fetchGithub(username) {
  const user = await get(`https://api.github.com/users/${encodeURIComponent(username)}`, {
    json: true,
    headers: { Accept: 'application/vnd.github+json', ...auth() },
  });

  let repos = [];
  try {
    repos = await get(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`,
      { json: true, headers: { Accept: 'application/vnd.github+json', ...auth() } },
    );
  } catch {
    repos = [];
  }

  const stars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
  const languages = {};
  for (const r of repos) if (r.language) languages[r.language] = (languages[r.language] || 0) + 1;

  return {
    username: user.login,
    publicRepos: user.public_repos ?? 0,
    followers: user.followers ?? 0,
    following: user.following ?? 0,
    stars,
    languages,
    topRepos: repos
      .slice()
      .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
      .slice(0, 6)
      .map((r) => ({ name: r.name, stars: r.stargazers_count || 0, language: r.language })),
    createdAt: user.created_at,
  };
}
