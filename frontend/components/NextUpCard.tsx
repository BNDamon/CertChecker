import { urgencyTone, formatCountdown } from '@/lib/expiry';
import { StatusBadge } from './StatusBadge';
import { AlertTriangleIcon } from './icons';

const TONE_BORDER: Record<string, string> = {
  ok: 'border-slate-800',
  warning: 'border-amber-500/30',
  danger: 'border-red-500/30',
  expired: 'border-red-500/30',
  unknown: 'border-slate-800',
};

export function NextUpCard({
  domain,
  kind,
  days,
}: {
  domain: string;
  kind: 'ssl' | 'domain';
  days: number | null;
}) {
  const tone = urgencyTone(days);
  const kindLabel = kind === 'ssl' ? 'SSL certificate' : 'domain registration';

  return (
    <div className={`mb-6 flex items-center justify-between rounded-2xl border bg-slate-900/60 px-5 py-4 ${TONE_BORDER[tone]}`}>
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
          <AlertTriangleIcon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">
            Next up: <span className="text-slate-200">{domain}</span>
          </p>
          <p className="text-xs text-slate-400">{kindLabel} is the soonest to renew</p>
        </div>
      </div>
      <StatusBadge tone={tone} label={formatCountdown(days)} />
    </div>
  );
}
