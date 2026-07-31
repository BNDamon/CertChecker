import type { ComponentType } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
  tone?: 'default' | 'warning' | 'danger' | 'accent';
}

const TONE_ICON_WRAP: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'bg-slate-800 text-slate-300',
  warning: 'bg-amber-500/10 text-amber-400',
  danger: 'bg-red-500/10 text-red-400',
  accent: 'bg-gradient-to-br from-accent-500/20 to-teal-500/20 text-accent-300',
};

export function StatCard({ label, value, icon: Icon, tone = 'default' }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TONE_ICON_WRAP[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-lg font-semibold leading-tight text-white">{value}</p>
          <p className="text-xs text-slate-400">{label}</p>
        </div>
      </div>
    </div>
  );
}
