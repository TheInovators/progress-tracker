import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { PLATFORMS, PLATFORM_KEYS } from '../lib/platforms.js';
import { useAuth } from '../lib/auth.jsx';
import { Alert, Button, Card, Spinner } from '../components/ui.jsx';

function MultiSelect({ label, options, selected, onToggle }) {
  if (!options.length) return null;
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((value) => (
          <button
            key={value}
            onClick={() => onToggle(value)}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              selected.includes(value)
                ? 'border-indigo-400 bg-indigo-500/20 text-indigo-200'
                : 'border-slate-700 text-slate-400 hover:border-slate-500'
            }`}
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Directory() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [facets, setFacets] = useState({ branches: [], sections: [], colleges: [] });
  const [filters, setFilters] = useState({ branch: [], section: [], college: [] });
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () =>
    Promise.all([api('/students'), api('/students/facets')])
      .then(([list, f]) => {
        setStudents(list.students);
        setFacets(f);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const toggleFilter = (key) => (value) =>
    setFilters((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
    }));

  // Filtering happens in the browser so the grid narrows as you type, exactly as
  // the deck describes. The same filters exist on the API for large cohorts.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter((s) => {
      if (filters.branch.length && !filters.branch.includes(s.branch)) return false;
      if (filters.section.length && !filters.section.includes(s.section)) return false;
      if (filters.college.length && !filters.college.includes(s.college)) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.rollNo.toLowerCase().includes(q) ||
        PLATFORM_KEYS.some((p) => (s.handles?.[p] || '').toLowerCase().includes(q))
      );
    });
  }, [students, filters, query]);

  const removeOne = async (id) => {
    if (!confirm('Delete this student profile permanently?')) return;
    await api(`/students/${id}`, { method: 'DELETE' }).catch((e) => setError(e.message));
    load();
  };

  const removePicked = async () => {
    if (!confirm(`Delete ${picked.length} selected profiles permanently?`)) return;
    await api('/students/bulk-delete', { method: 'POST', body: { ids: picked } }).catch((e) =>
      setError(e.message),
    );
    setPicked([]);
    load();
  };

  if (loading) return <Spinner label="Loading the directory" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Student Directory</h1>
          <p className="text-sm text-slate-400">
            Showing {visible.length} of {students.length} students
          </p>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, roll number or handle"
          className="w-72 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
      </div>

      <Alert>{error}</Alert>

      <Card className="grid gap-5 md:grid-cols-3">
        <MultiSelect
          label="Branch"
          options={facets.branches}
          selected={filters.branch}
          onToggle={toggleFilter('branch')}
        />
        <MultiSelect
          label="Section"
          options={facets.sections}
          selected={filters.section}
          onToggle={toggleFilter('section')}
        />
        <MultiSelect
          label="College"
          options={facets.colleges}
          selected={filters.college}
          onToggle={toggleFilter('college')}
        />
      </Card>

      {user.isAdmin && picked.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-800 bg-amber-950/40 px-4 py-3 text-sm">
          <span>{picked.length} selected</span>
          <Button variant="danger" onClick={removePicked}>
            Delete selected
          </Button>
          <button onClick={() => setPicked([])} className="text-slate-400 hover:text-slate-200">
            Clear
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((s) => (
          <Card key={s._id} className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{s.name}</p>
                <span className="mt-1 inline-block rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                  {s.rollNo}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-indigo-500/15 px-2 py-1 text-sm font-semibold text-indigo-300">
                  {s.composite.toFixed(1)}
                </span>
                {user.isAdmin && (
                  <>
                    <input
                      type="checkbox"
                      checked={picked.includes(s._id)}
                      onChange={(e) =>
                        setPicked((p) =>
                          e.target.checked ? [...p, s._id] : p.filter((id) => id !== s._id),
                        )
                      }
                      className="size-4 accent-indigo-500"
                    />
                    <button
                      onClick={() => removeOne(s._id)}
                      title="Delete profile"
                      className="text-slate-500 hover:text-rose-400"
                    >
                      ✕
                    </button>
                  </>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-500">
              {[s.branch, s.section, s.college].filter(Boolean).join(' · ') || 'No cohort set'}
            </p>

            <div className="flex flex-wrap gap-1.5">
              {PLATFORM_KEYS.filter((p) => s.handles?.[p]).map((p) => (
                <span
                  key={p}
                  className="rounded border border-slate-700 px-2 py-0.5 text-xs"
                  style={{ color: PLATFORMS[p].colour }}
                >
                  {PLATFORMS[p].label}: {s.handles[p]}
                </span>
              ))}
              {!PLATFORM_KEYS.some((p) => s.handles?.[p]) && (
                <span className="text-xs text-slate-600">No platforms linked yet</span>
              )}
            </div>

            <Link
              to={`/students/${s._id}`}
              className="mt-auto text-sm text-indigo-400 hover:underline"
            >
              View dashboard →
            </Link>
          </Card>
        ))}
      </div>

      {!visible.length && (
        <p className="py-12 text-center text-sm text-slate-500">
          No students match these filters.
        </p>
      )}
    </div>
  );
}
