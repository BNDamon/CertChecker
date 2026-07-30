import type { UrgencyTone } from '@/lib/expiry';
import { CheckCircleIcon, AlertTriangleIcon, XCircleIcon } from './icons';

const TONE_STYLES: Record<UrgencyTone, string> = {
  ok: 'bg-green-500/10 text-green-400 ring-green-500/25',
  warning: 'bg-amber-500/10 text-amber-400 ring-amber-500/25',
  danger: 'bg-red-500/10 text-red-400 ring-red-500/25',
  expired: 'bg-red-500/10 text-red-400 ring-red-500/25',
  unknown: 'bg-slate-700/40 text-slate-400 ring-slate-600/40',
};

const TONE_ICON: Record<UrgencyTone, typeof CheckCircleIcon> = {
  ok: CheckCircleIcon,
  warning: AlertTriangleIcon,
  danger: AlertTriangleIcon,
  expired: XCircleIcon,
  unknown: XCircleIcon,
};

export function StatusBadge({ tone, label }: { tone: UrgencyTone; label: string }) {
  const Icon = TONE_ICON[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${TONE_STYLES[tone]}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {label}
    </span>
  );
}
