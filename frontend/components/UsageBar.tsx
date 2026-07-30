export function UsageBar({ count, limit }: { count: number; limit: number }) {
  const pct = Math.min(100, Math.round((count / limit) * 100));
  const atLimit = count >= limit;

  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full transition-all ${atLimit ? 'bg-amber-500' : 'bg-gradient-to-r from-accent-500 to-indigo-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-slate-400">
        {count} / {limit} domains
      </span>
    </div>
  );
}
