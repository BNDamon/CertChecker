import type { AlertTrendDay } from '@/lib/api';

// Slots 1 and 2 of the dataviz skill's validated categorical order (blue,
// orange) -- the top of the fixed sequence, chosen instead of an arbitrary
// pair because that ordering is the one that's actually been run through the
// CVD/contrast validator against a dark surface.
const SERIES = {
  ssl: { color: '#3987e5', label: 'SSL certificate' },
  domain: { color: '#d95926', label: 'Domain registration' },
} as const;

const PLOT_HEIGHT = 140;

export function AlertTrendChart({ trend }: { trend: AlertTrendDay[] }) {
  const totalSsl = trend.reduce((sum, d) => sum + d.ssl, 0);
  const totalDomain = trend.reduce((sum, d) => sum + d.domain, 0);
  const max = Math.max(1, ...trend.map((d) => d.ssl + d.domain));

  if (totalSsl + totalDomain === 0) {
    return <p className="text-sm text-slate-400">No alerts sent in the last 30 days.</p>;
  }

  return (
    <div>
      <div className="mb-4 flex gap-5">
        {(Object.keys(SERIES) as Array<keyof typeof SERIES>).map((key) => (
          <div key={key} className="flex items-center gap-1.5 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: SERIES[key].color }} />
            <span className="text-slate-300">{SERIES[key].label}</span>
            <span className="font-medium text-white">{key === 'ssl' ? totalSsl : totalDomain}</span>
          </div>
        ))}
      </div>

      <div
        className="flex items-end gap-[3px] border-b border-slate-800"
        style={{ height: PLOT_HEIGHT }}
        role="img"
        aria-label="Alerts sent per day over the last 30 days"
      >
        {trend.map((day) => {
          const sslHeight = (day.ssl / max) * PLOT_HEIGHT;
          const domainHeight = (day.domain / max) * PLOT_HEIGHT;
          const label = `${day.date}: ${day.ssl} SSL, ${day.domain} registration alert${day.ssl + day.domain === 1 ? '' : 's'}`;

          return (
            <div
              key={day.date}
              className="group flex flex-1 flex-col justify-end"
              style={{ height: PLOT_HEIGHT }}
              title={label}
              tabIndex={0}
              aria-label={label}
            >
              {day.ssl + day.domain === 0 ? (
                <div className="h-[2px] w-full rounded-full bg-slate-700 transition-opacity group-hover:opacity-60 group-focus:opacity-60" />
              ) : (
                <>
                  {day.domain > 0 && (
                    <div
                      className="w-full transition-opacity group-hover:opacity-80 group-focus:opacity-80"
                      style={{ height: domainHeight, backgroundColor: SERIES.domain.color }}
                    />
                  )}
                  {day.ssl > 0 && day.domain > 0 && <div className="h-[2px] w-full" />}
                  {day.ssl > 0 && (
                    <div
                      className="w-full rounded-t-sm transition-opacity group-hover:opacity-80 group-focus:opacity-80"
                      style={{ height: sslHeight, backgroundColor: SERIES.ssl.color }}
                    />
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-1.5 flex justify-between text-xs text-slate-500">
        <span>{trend[0]?.date}</span>
        <span>{trend[trend.length - 1]?.date}</span>
      </div>
    </div>
  );
}
