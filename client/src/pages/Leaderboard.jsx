import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { PLATFORMS, PLATFORM_KEYS } from '../lib/platforms.js';
import { Alert, Card, Spinner } from '../components/ui.jsx';

const SORTS = [['composite', 'Composite'], ...PLATFORM_KEYS.map((p) => [p, PLATFORMS[p].label])];

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Leaderboard() {
  const [rows, setRows] = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [sort, setSort] = useState('composite');
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/leaderboard?sort=${sort}`).then(setRows).catch((e) => setError(e.message));
  }, [sort]);

  useEffect(() => {
    api('/leaderboard/monthly').then(setMonthly).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leaderboard</h1>
          <p className="text-sm text-slate-400">College-wide rankings, sortable by any platform.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SORTS.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              className={`rounded-lg px-3 py-1.5 text-xs transition ${
                sort === key ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <Alert>{error}</Alert>

      {monthly && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-amber-700/60 bg-amber-500/5">
            <p className="text-xs uppercase tracking-widest text-amber-400">Monthly spotlight</p>
            {monthly.topPerformer ? (
              <>
                <p className="mt-2 text-xl font-semibold">{monthly.topPerformer.name}</p>
                <p className="text-sm text-slate-400">
                  Top performer for {monthly.month} · {monthly.topPerformer.composite.toFixed(2)}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-400">No scores recorded this month yet.</p>
            )}
          </Card>

          <Card className="border-emerald-700/60 bg-emerald-500/5">
            <p className="text-xs uppercase tracking-widest text-emerald-400">Most improved</p>
            {monthly.mostImproved ? (
              <>
                <p className="mt-2 text-xl font-semibold">{monthly.mostImproved.name}</p>
                <p className="text-sm text-slate-400">
                  Gained {monthly.mostImproved.delta.toFixed(2)} points since last month
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-400">
                Needs two months of snapshots before a gain can be measured.
              </p>
            )}
          </Card>
        </div>
      )}

      {!rows ? (
        <Spinner label="Ranking students" />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Cohort</th>
                {PLATFORM_KEYS.map((p) => (
                  <th key={p} className="px-4 py-3">
                    {PLATFORMS[p].label}
                  </th>
                ))}
                <th className="px-4 py-3 text-right">Composite</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-900 hover:bg-slate-900/60">
                  <td className="px-4 py-3 text-slate-400">{MEDALS[r.rank - 1] || r.rank}</td>
                  <td className="px-4 py-3">
                    <Link to={`/students/${r.id}`} className="hover:text-indigo-300">
                      {r.name}
                    </Link>
                    <span className="ml-2 text-xs text-slate-600">{r.rollNo}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {[r.branch, r.section].filter(Boolean).join('-') || '-'}
                  </td>
                  {PLATFORM_KEYS.map((p) => (
                    <td key={p} className="px-4 py-3 text-xs text-slate-400">
                      {r.stats?.[p] ? PLATFORMS[p].headline(r.stats[p]) : '-'}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right font-semibold text-indigo-300">
                    {r.composite.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
