import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';
import { PLATFORMS } from '../lib/platforms.js';
import { Alert, Card, Spinner } from '../components/ui.jsx';

const REMINDER_KEY = 'pt.reminders';

const readReminders = () => {
  try {
    return JSON.parse(localStorage.getItem(REMINDER_KEY) || '[]');
  } catch {
    return [];
  }
};

const countdown = (startsAt) => {
  const ms = new Date(startsAt) - Date.now();
  if (ms <= 0) return 'starting now';
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  return days > 0 ? `in ${days}d ${hours}h` : `in ${hours}h ${Math.floor((ms % 3600000) / 60000)}m`;
};

export default function Contests() {
  const [contests, setContests] = useState(null);
  const [window, setWindow] = useState('month');
  const [platform, setPlatform] = useState('');
  const [reminders, setReminders] = useState(readReminders);
  const [error, setError] = useState('');

  useEffect(() => {
    setContests(null);
    const params = new URLSearchParams({ window });
    if (platform) params.set('platform', platform);
    api(`/contests?${params}`).then(setContests).catch((e) => setError(e.message));
  }, [window, platform]);

  const toggleReminder = (url) => {
    const next = reminders.includes(url) ? reminders.filter((u) => u !== url) : [...reminders, url];
    setReminders(next);
    localStorage.setItem(REMINDER_KEY, JSON.stringify(next));
  };

  // Group by calendar day so the list reads like a week view rather than a feed.
  const byDay = useMemo(() => {
    const groups = new Map();
    for (const c of contests || []) {
      const day = new Date(c.startsAt).toDateString();
      if (!groups.has(day)) groups.set(day, []);
      groups.get(day).push(c);
    }
    return [...groups.entries()];
  }, [contests]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contest Calendar</h1>
          <p className="text-sm text-slate-400">
            Upcoming rounds from Codeforces, LeetCode and CodeChef in one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs">
          {[
            ['week', 'This week'],
            ['month', 'This month'],
            ['', 'All upcoming'],
          ].map(([value, label]) => (
            <button
              key={label}
              onClick={() => setWindow(value)}
              className={`rounded-lg px-3 py-1.5 ${
                window === value ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <button
          onClick={() => setPlatform('')}
          className={`rounded-full border px-3 py-1 ${
            platform ? 'border-slate-700 text-slate-400' : 'border-indigo-400 text-indigo-200'
          }`}
        >
          All platforms
        </button>
        {['codeforces', 'leetcode', 'codechef'].map((p) => (
          <button
            key={p}
            onClick={() => setPlatform(p)}
            className={`rounded-full border px-3 py-1 ${
              platform === p ? 'border-indigo-400' : 'border-slate-700'
            }`}
            style={{ color: PLATFORMS[p].colour }}
          >
            {PLATFORMS[p].label}
          </button>
        ))}
      </div>

      <Alert>{error}</Alert>

      <Card className="border-slate-800/60 bg-slate-900/30 text-xs text-slate-500">
        GeeksforGeeks publishes no contest feed, so its rounds cannot be aggregated here.
      </Card>

      {!contests ? (
        <Spinner label="Fetching contest schedules" />
      ) : !contests.length ? (
        <p className="py-12 text-center text-sm text-slate-500">Nothing scheduled in this window.</p>
      ) : (
        <div className="space-y-5">
          {byDay.map(([day, list]) => (
            <div key={day}>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">{day}</p>
              <div className="space-y-2">
                {list.map((c) => (
                  <Card key={c.url} className="flex flex-wrap items-center gap-4 py-3">
                    <span
                      className="w-1.5 self-stretch rounded"
                      style={{ background: PLATFORMS[c.platform].colour }}
                    />
                    <div className="min-w-0 flex-1">
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium hover:text-indigo-300"
                      >
                        {c.name}
                      </a>
                      <p className="text-xs text-slate-500">
                        {PLATFORMS[c.platform].label} ·{' '}
                        {new Date(c.startsAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        · {c.durationMinutes} min · {countdown(c.startsAt)}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleReminder(c.url)}
                      className={`rounded-lg px-3 py-1.5 text-xs ${
                        reminders.includes(c.url)
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-100'
                      }`}
                    >
                      {reminders.includes(c.url) ? 'Reminder on' : 'Remind me'}
                    </button>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
