import type { UrgencyTone } from '@/lib/expiry';
import { CheckCircleIcon, AlertTriangleIcon, XCircleIcon } from './icons';

const TONE_STYLES: Record<UrgencyTone, string> = {
  ok: 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20',
  warning:
    'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
  danger: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20',
  expired: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20',
  unknown: 'bg-gray-100 text-gray-500 ring-gray-500/10 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700',
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
