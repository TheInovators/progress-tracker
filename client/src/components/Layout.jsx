import { NavLink } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';

const LINKS = [
  ['/', 'Directory'],
  ['/me', 'My Dashboard'],
  ['/leaderboard', 'Leaderboard'],
  ['/contests', 'Contests'],
  ['/workspace', 'Chat & IDE'],
  ['/settings', 'Settings'],
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-6 py-3">
          <span className="text-lg font-semibold tracking-tight">
            Progress<span className="text-indigo-400">Tracker</span>
          </span>

          <nav className="flex flex-wrap gap-1 text-sm">
            {LINKS.map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 transition ${
                    isActive ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-slate-100'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="text-slate-400">
              {user.name}
              {user.isAdmin && (
                <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-300">
                  admin
                </span>
              )}
            </span>
            <button onClick={logout} className="text-slate-500 hover:text-rose-300">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
