import { get, num } from './http.js';

// CodeChef has no public profile API, so this parses the public profile page.
// Selectors are pinned to markup that has been stable for years, but a CodeChef
// redesign will break them; every field falls back to 0 rather than throwing.
export async function fetchCodechef(username) {
  const html = await get(`https://www.codechef.com/users/${encodeURIComponent(username)}`);
  if (/Sorry, this user does not exist|Page Not Found/i.test(html)) {
    throw new Error('codechef: user not found');
  }

  const pick = (re) => {
    const m = html.match(re);
    return m ? m[1].trim() : '';
  };

  const stars = (html.match(/<div class="rating-star">([\s\S]*?)<\/div>/)?.[1].match(/★|&#9733;/g) || [])
    .length;
  const globalRank = pick(/<a href="\/ratings\/all[^"]*">\s*<strong>\s*([\s\S]*?)<\/strong>/);

  return {
    username,
    rating: num(pick(/rating-number">\s*([\d,]+)/)),
    highestRating: num(pick(/Highest Rating[^0-9]*([\d,]+)/)),
    stars,
    globalRank: num(globalRank),
    problemsSolved: num(pick(/Problems Solved:\s*([\d,]+)/)),
    division: pick(/\(Div\s*(\d)\)/),
  };
}
