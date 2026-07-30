// Status colors from the dataviz skill's validated reference palette (not the
// app's Tailwind accent scale) -- these four are checked for >=3:1 contrast
// against our dark surface and kept visually distinct from the categorical
// chart colors used elsewhere (see AlertTrendChart), per the skill's rule
// that a status color must never impersonate a series.
const STATUS = {
  healthy: { color: '#0ca30c', label: 'Healthy' },
  warning: { color: '#fab219', label: 'Expiring soon' },
  critical: { color: '#d03b3b', label: 'Expired' },
  unknown: { color: '#898781', label: 'Unknown' },
} as const;

type Bucket = keyof typeof STATUS;

export function HealthBreakdownChart({
  breakdown,
}: {
  breakdown: Record<Bucket, number>;
}) {
  const total = breakdown.healthy + breakdown.warning + breakdown.critical + breakdown.unknown;
  const order: Bucket[] = ['healthy', 'warning', 'critical', 'unknown'];
  const visible = order.filter((b) => breakdown[b] > 0);

  if (total === 0) {
    return <p className="text-sm text-slate-400">No domains tracked yet.</p>;
  }

  return (
    <div>
      <div className="flex h-7 w-full overflow-hidden rounded-full bg-slate-800" role="img" aria-label="Domain health breakdown">
        {visible.map((bucket, i) => {
          const pct = (breakdown[bucket] / total) * 100;
          return (
            <div
              key={bucket}
              title={`${STATUS[bucket].label}: ${breakdown[bucket]} of ${total}`}
              tabIndex={0}
              aria-label={`${STATUS[bucket].label}: ${breakdown[bucket]} of ${total} domains`}
              className="h-full transition-opacity hover:opacity-80 focus:opacity-80 focus:outline-none"
              style={{
                width: `${pct}%`,
                backgroundColor: STATUS[bucket].color,
                marginRight: i < visible.length - 1 ? '2px' : 0,
              }}
            />
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        {order.map((bucket) => (
          <div key={bucket} className="flex items-center gap-1.5 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: STATUS[bucket].color }} />
            <span className="text-slate-300">{STATUS[bucket].label}</span>
            <span className="font-medium text-white">{breakdown[bucket]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
