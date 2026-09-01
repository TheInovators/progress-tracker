import { useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { PLATFORMS, PLATFORM_KEYS } from '../lib/platforms.js';
import { Alert, Button, Card, Field } from '../components/ui.jsx';

export default function Settings() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user.name,
    branch: user.branch,
    section: user.section,
    college: user.college,
    dob: user.dob ? user.dob.slice(0, 10) : '',
    handles: { ...PLATFORM_KEYS.reduce((a, p) => ({ ...a, [p]: user.handles?.[p] || '' }), {}) },
  });
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const dobLocked = Boolean(user.dob);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const setHandle = (p) => (e) =>
    setForm({ ...form, handles: { ...form.handles, [p]: e.target.value } });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setStatus('');
    try {
      const payload = { ...form };
      if (dobLocked || !form.dob) delete payload.dob;

      const updated = await api(`/students/${user._id}`, { method: 'PATCH', body: payload });
      setUser(updated);
      setStatus('Profile saved. Refresh your dashboard to pull the new stats.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile Settings</h1>
        <p className="text-sm text-slate-400">
          Your roll number is {user.rollNo}. Platform usernames drive every score on the site.
        </p>
      </div>

      <form onSubmit={save} className="space-y-4">
        <Card className="space-y-4">
          <Field label="Full name" value={form.name} onChange={set('name')} required />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Branch" value={form.branch} onChange={set('branch')} />
            <Field label="Section" value={form.section} onChange={set('section')} />
            <Field label="College / University" value={form.college} onChange={set('college')} />
          </div>
          <Field
            label="Date of birth"
            type="date"
            value={form.dob}
            onChange={set('dob')}
            disabled={dobLocked}
            hint={
              dobLocked
                ? 'Locked. Not even an administrator can change this once saved.'
                : 'Private, and locked permanently after the first save.'
            }
          />
        </Card>

        <Card className="space-y-4">
          <p className="text-sm font-medium">Platform usernames</p>
          {PLATFORM_KEYS.map((p) => (
            <Field
              key={p}
              label={PLATFORMS[p].label}
              value={form.handles[p]}
              onChange={setHandle(p)}
              placeholder={`Your ${PLATFORMS[p].label} username`}
            />
          ))}
        </Card>

        <Alert>{error}</Alert>
        {status && (
          <p className="rounded-lg border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
            {status}
          </p>
        )}

        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save changes'}
        </Button>
      </form>

      {user.isAdmin && (
        <Card className="border-amber-800/60 bg-amber-500/5 text-sm">
          <p className="font-medium text-amber-300">Administrator capabilities</p>
          <ul className="mt-2 space-y-1 text-xs text-slate-400">
            <li>Edit any student's name, cohort and platform usernames from their dashboard.</li>
            <li>Delete a single profile, or several at once with the directory checkboxes.</li>
            <li>Force a stats refresh for any student, bypassing the cache window.</li>
            <li>Date of birth stays locked for everyone, including you.</li>
          </ul>
        </Card>
      )}
    </div>
  );
}
