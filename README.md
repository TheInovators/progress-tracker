# Progress Tracker

A coding performance dashboard for a college department. One student, five platform
usernames, one comparable score.

Students register once and add their LeetCode, Codeforces, GeeksforGeeks, CodeChef and
GitHub usernames. The server pulls each profile from the live platform, normalises five
incompatible scoring systems onto a shared 0 to 100 scale, and combines them into a single
weighted composite. From there the app builds a browsable directory, per-student charts,
a sortable college leaderboard, monthly recognition, a merged contest calendar, and a chat
room with a compiler beside it.

## What it does

| Module | Behaviour |
| --- | --- |
| Multi-platform sync | Live fetch from all five platforms, in parallel, one failure does not blank the rest |
| Student directory | Card grid with search, multi-select filters and a live match count |
| My Dashboard | Summary cards plus rating trend, difficulty split, repository activity and score history charts |
| Platform score | Weighted composite with a per-platform strength breakdown |
| Leaderboard | Ranked table, sortable by composite or by any single platform |
| Monthly top performers | Highest composite and biggest month-over-month gain, computed from stored snapshots |
| Bulk filter and search | Client-side filtering as you type, with the same filters on the API for large cohorts |
| Contest calendar | Upcoming rounds from Codeforces, LeetCode and CodeChef, grouped by day |
| Chat and IDE | Socket.IO room next to a Monaco editor running Java, C++ and Python through Judge0 |

## Running it

Node 20 or newer. The API listens on 5001 because macOS binds port 5000 to AirPlay Receiver.

```bash
# terminal 1
cd server
cp .env.example .env
npm install
npm run dev          # http://localhost:5001

# terminal 2
cd client
cp .env.example .env
npm install
npm run dev          # http://localhost:5173
```

With `MONGO_URI` left blank the server starts a throwaway in-memory MongoDB, so a fresh
clone runs without installing a database. Data disappears on restart. For persistence,
point `MONGO_URI` at Atlas or start the bundled container:

```bash
docker compose up -d
echo 'MONGO_URI=mongodb://localhost:27017' >> server/.env
```

**The first account to register becomes the administrator.** Everyone after that is a
student.

With a persistent database you can also load a demo roster of four students wired to real
public accounts:

```bash
cd server && npm run seed     # sign in as krishna@kiet.edu / password123
```

## How the score works

Each platform measures something different, so a raw Codeforces rating of 3500 cannot be
added to 400 solved LeetCode problems. Every stat is first mapped to a 0 to 100 strength,
then the weights from the design are applied:

| Platform | Weight | Strength derived from |
| --- | --- | --- |
| LeetCode | 25% | Solved count weighted by difficulty (easy 1, medium 2.5, hard 5) |
| Codeforces | 20% | Current rating, banded from 800 to 3000 |
| GeeksforGeeks | 20% | Coding score plus problems solved |
| CodeChef | 15% | Current rating, banded from 1000 to 2500 |
| GitHub | 20% | Public repositories, followers and log-scaled stars |

Weights live in `server/src/score.js` and sum to 1, so the composite always lands between
0 and 100. A platform a student has not linked scores 0 and still consumes its weight,
which means linking a fifth platform can only ever raise the composite, never lower it.
The normalisers are the tuning surface: an institute that cares more about contests than
repositories edits one object.

`npm test` in `server/` covers the score module, including the saturation, clamping and
missing-platform cases.

## Where the data comes from

Codeforces, GitHub and LeetCode expose usable public endpoints, so those three fetchers
call documented APIs.

CodeChef and GeeksforGeeks publish no profile API at all. Their fetchers parse the public
profile page instead: CodeChef from server-rendered HTML, GeeksforGeeks from the streamed
React payload the Next.js app router embeds in the page. Both were verified against live
accounts, and every field falls back to zero rather than throwing, but a redesign on
either site will break them. They are the first thing to check when a score looks wrong.
Both scrapers are single files under `server/src/fetchers/`.

Stats are cached per student for `STATS_TTL_MINUTES` (60 by default). The Refresh Stats
button bypasses the cache. The contest calendar caches for 15 minutes across all users.

GeeksforGeeks publishes no contest feed in any form, so its rounds cannot appear on the
calendar. That gap is stated in the UI rather than hidden.

## Code execution

The IDE posts to Judge0. The default target is the free public instance at `ce.judge0.com`,
which is rate limited and frequently unavailable. For anything beyond a demo, self-host
Judge0 or set `JUDGE0_URL` and `JUDGE0_RAPIDAPI_KEY` to a RapidAPI endpoint.

## Access rules

- Sessions are JWTs, valid for seven days, and the chat socket verifies the same token.
- Students may edit only their own profile. Admins may edit anyone.
- Only admins delete profiles, one at a time or in bulk.
- Only an existing admin can grant admin.
- Date of birth is write-once. Once a student saves it, nobody can change it, administrators
  included.

## Stack

React 18, Tailwind CSS 4, Chart.js and Monaco on the client. Express 5, Mongoose, JSON Web
Tokens and Socket.IO on the server. Judge0 for code execution.

## Deploying

The API goes to Render, the client to Vercel, and the database to MongoDB Atlas. Render
has no managed MongoDB, which is why the database is a third service rather than two.

### 1. Database

Create a free M0 cluster on MongoDB Atlas. Add a database user, then under Network Access
allow `0.0.0.0/0`, because Render's free tier gives no static outbound IP to allowlist.
Copy the connection string.

### 2. API on Render

`render.yaml` in the repository root describes the service, so pointing Render at this
repo as a Blueprint picks up the build command, health check and Node version. Two
variables are marked `sync: false` and must be pasted into the dashboard by hand:

- `MONGO_URI`, the Atlas connection string
- `CLIENT_ORIGIN`, your Vercel domain, filled in after step 3

`JWT_SECRET` generates itself on first deploy. Leave it alone unless you want to sign
every existing session out, which changing it does.

The free plan sleeps after fifteen minutes of no traffic, so the first request after an
idle period takes roughly fifty seconds while the container wakes. Stats refreshes and
contest fetches are slow anyway, so this mostly shows up as a slow first page load.

### 3. Client on Vercel

Import the repository and set the root directory to `client`. `client/vercel.json` supplies
the framework, build command and output directory, plus the rewrite that sends every path
to `index.html`. Without that rewrite, loading `/leaderboard` directly returns a 404
instead of the app, because the router lives entirely in the browser.

Set one environment variable:

```
VITE_API_URL=https://your-api.onrender.com
```

Vite inlines this at build time, not at runtime, so changing it later needs a redeploy.

### 4. Close the loop

Put the Vercel domain into `CLIENT_ORIGIN` on Render. It accepts a comma-separated list.
Setting `VERCEL_PREVIEWS=on` additionally accepts any `*.vercel.app` hostname, which is
what makes preview deployments work without editing the variable on every branch.

Both CORS and the Socket.IO handshake read the same list, so chat breaks in exactly the
same way as the REST API if the domain is wrong. That is the first thing to check when
the app loads but no data appears.
