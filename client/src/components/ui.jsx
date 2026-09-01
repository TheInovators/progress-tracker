export function Card({ className = '', children }) {
  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-900/60 p-5 ${className}`}>
      {children}
    </div>
  );
}

export function Button({ variant = 'solid', className = '', ...props }) {
  const styles = {
    solid: 'bg-indigo-500 hover:bg-indigo-400 text-white',
    ghost: 'bg-slate-800 hover:bg-slate-700 text-slate-200',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white',
  };
  return (
    <button
      {...props}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
    />
  );
}

export function Field({ label, hint, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <input
        {...props}
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-500 disabled:opacity-60"
      />
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function Spinner({ label = 'Loading' }) {
  return <p className="p-8 text-center text-sm text-slate-400">{label}...</p>;
}

export function Alert({ children }) {
  if (!children) return null;
  return (
    <p className="rounded-lg border border-rose-800 bg-rose-950/50 px-3 py-2 text-sm text-rose-200">
      {children}
    </p>
  );
}
