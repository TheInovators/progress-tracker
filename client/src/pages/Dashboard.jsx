import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { api } from '../lib/api.js';
import { PLATFORMS, PLATFORM_KEYS } from '../lib/platforms.js';
import { useAuth } from '../lib/auth.jsx';
import { Alert, Button, Card, Spinner } from '../components/ui.jsx';

Chart.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
);

const GRID = { color: '#1e293b' };
const TICKS = { color: '#94a3b8', font: { size: 10 } };
const BASE_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#cbd5f5', font: { size: 11 } } } },
  scales: { x: { grid: GRID, ticks: TICKS }, y: { grid: GRID, ticks: TICKS } },
};

export default function Dashboard() {
  const { id } = useParams();
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setStudent(null);
    api(`/students/${id}`).then(setStudent).catch((e) => setError(e.message));
  }, [id]);

  const refresh = async () => {
    setRefreshing(true);
    setError('');
    try {
      const { student: fresh } = await api(`/students/${id}/refresh?force=1`, { method: 'POST' });
      setStudent(fresh);
    } catch (e) {
      setError(e.message);
    } finally {
      setRefreshing(false);
    }
  };

  if (error && !student) return <Alert>{error}</Alert>;
  if (!student) return <Spinner label="Loading dashboard" />;

  const stats = student.platformData?.stats || {};
  const fetchErrors = student.platformData?.fetchErrors || {};
  const canRefresh = user.isAdmin || user._id === student._id;
  const linked = PLATFORM_KEYS.filter((p) => student.handles?.[p]);

  const cf = stats.codeforces;
  const lc = stats.leetcode;
  const gh = stats.github;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{student.name}</h1>
          <p className="text-sm text-slate-400">
            {student.rollNo} · {[student.branch, student.section, student.college].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-slate-500">Composite score</p>
            <p className="text-3xl font-semibold text-indigo-300">{student.composite.toFixed(2)}</p>
          </div>
          {canRefresh && (
            <Button onClick={refresh} disabled={refreshing}>
              {refreshing ? 'Fetching...' : 'Refresh stats'}
            </Button>
          )}
        </div>
      </div>

      {student.platformData?.fetchedAt && (
        <p className="text-xs text-slate-500">
          Last synced {new Date(student.platformData.fetchedAt).toLocaleString()}
        </p>
      )}
      <Alert>{error}</Alert>

      {Object.keys(fetchErrors).length > 0 && (
        <Card className="border-amber-800 bg-amber-950/30 text-sm text-amber-200">
          <p className="font-medium">Some platforms did not respond</p>
          <ul className="mt-1 space-y-0.5 text-xs">
            {Object.entries(fetchErrors).map(([platform, message]) => (
              <li key={platform}>
                {PLATFORMS[platform].label}: {message}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {linked.map((p) => {
          const meta = PLATFORMS[p];
          const raw = stats[p];
          return (
            <Card key={p}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: meta.colour }}>
                  {meta.label}
                </span>
                <span className="text-xs text-slate-500">@{student.handles[p]}</span>
              </div>
              {raw ? (
                <>
                  <p className="mt-2 text-2xl font-semibold">{meta.headline(raw)}</p>
                  <p className="mt-1 text-xs text-slate-400">{meta.detail(raw)}</p>
                </>
              ) : (
                <p className="mt-2 text-sm text-slate-500">No data yet</p>
              )}
              <div className="mt-3 h-1.5 overflow-hidden rounded bg-slate-800">
                <div
                  className="h-full rounded"
                  style={{
                    width: `${student.breakdown?.[p]?.strength || 0}%`,
                    background: meta.colour,
                  }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {(student.breakdown?.[p]?.strength || 0).toFixed(1)} / 100 strength ·{' '}
                {Math.round((student.breakdown?.[p]?.weight || 0) * 100)}% weight
              </p>
            </Card>
          );
        })}
        {!linked.length && (
          <Card className="sm:col-span-2 lg:col-span-3 text-sm text-slate-400">
            No platforms linked. Add usernames under Settings, then refresh.
          </Card>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {cf?.ratingHistory?.length > 0 && (
          <Card>
            <p className="mb-3 text-sm font-medium">Codeforces rating trend</p>
            <div className="h-64">
              <Line
                options={BASE_OPTIONS}
                data={{
                  labels: cf.ratingHistory.map((h) => new Date(h.at).toLocaleDateString()),
                  datasets: [
                    {
                      label: 'Rating',
                      data: cf.ratingHistory.map((h) => h.rating),
                      borderColor: PLATFORMS.codeforces.colour,
                      backgroundColor: 'rgba(59,130,246,0.15)',
                      pointRadius: 0,
                      borderWidth: 2,
                      fill: true,
                      tension: 0.25,
                    },
                  ],
                }}
              />
            </div>
          </Card>
        )}

        {lc && (
          <Card>
            <p className="mb-3 text-sm font-medium">LeetCode difficulty split</p>
            <div className="h-64">
              <Doughnut
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom', labels: { color: '#cbd5f5' } } },
                }}
                data={{
                  labels: ['Easy', 'Medium', 'Hard'],
                  datasets: [
                    {
                      data: [lc.easy, lc.medium, lc.hard],
                      backgroundColor: ['#22c55e', '#f0a020', '#ef4444'],
                      borderColor: '#0f172a',
                      borderWidth: 2,
                    },
                  ],
                }}
              />
            </div>
          </Card>
        )}

        {gh?.topRepos?.length > 0 && (
          <Card>
            <p className="mb-3 text-sm font-medium">GitHub repository activity</p>
            <div className="h-64">
              <Bar
                options={{ ...BASE_OPTIONS, plugins: { legend: { display: false } } }}
                data={{
                  labels: gh.topRepos.map((r) => r.name),
                  datasets: [
                    {
                      label: 'Stars',
                      data: gh.topRepos.map((r) => r.stars),
                      backgroundColor: '#6366f1',
                      borderRadius: 4,
                    },
                  ],
                }}
              />
            </div>
          </Card>
        )}

        {student.history?.length > 1 && (
          <Card>
            <p className="mb-3 text-sm font-medium">Composite score by month</p>
            <div className="h-64">
              <Line
                options={BASE_OPTIONS}
                data={{
                  labels: student.history.map((h) => h.month),
                  datasets: [
                    {
                      label: 'Composite',
                      data: student.history.map((h) => h.composite),
                      borderColor: '#818cf8',
                      backgroundColor: 'rgba(129,140,248,0.15)',
                      fill: true,
                      tension: 0.3,
                    },
                  ],
                }}
              />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
