import { useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { Alert, Button, Card, Field } from '../components/ui.jsx';

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', branch: '', section: '', college: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (mode === 'login') await login({ email: form.email, password: form.password });
      else await register(form);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md">
        <h1 className="mb-1 text-3xl font-semibold tracking-tight">
          Progress<span className="text-indigo-400">Tracker</span>
        </h1>
        <p className="mb-6 text-sm text-slate-400">
          Five coding profiles, one picture of your growth.
        </p>

        <Card>
          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <>
                <Field label="Full name" value={form.name} onChange={set('name')} required />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Branch" value={form.branch} onChange={set('branch')} placeholder="IT" />
                  <Field label="Section" value={form.section} onChange={set('section')} placeholder="B" />
                </div>
                <Field label="College" value={form.college} onChange={set('college')} />
              </>
            )}

            <Field label="Email" type="email" value={form.email} onChange={set('email')} required />
            <Field
              label="Password"
              type="password"
              value={form.password}
              onChange={set('password')}
              required
              hint={mode === 'register' ? 'At least 8 characters' : undefined}
            />

            <Alert>{error}</Alert>

            <Button type="submit" disabled={busy} className="w-full">
              {busy ? 'Working...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-400">
            {mode === 'login' ? 'No account yet?' : 'Already registered?'}{' '}
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError('');
              }}
              className="text-indigo-400 hover:underline"
            >
              {mode === 'login' ? 'Register' : 'Sign in'}
            </button>
          </p>
        </Card>

        <p className="mt-4 text-center text-xs text-slate-600">
          The first account created becomes the directory administrator.
        </p>
      </div>
    </div>
  );
}
