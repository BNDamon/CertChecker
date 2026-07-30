'use client';

import type { TrackedDomain } from '@/lib/api';
import { daysUntil, urgencyTone, formatCountdown } from '@/lib/expiry';
import { StatusBadge } from './StatusBadge';
import { GlobeIcon, TrashIcon } from './icons';

function sslLabel(domain: TrackedDomain, days: number | null) {
  if (domain.ssl_status === 'error') return 'Check failed';
  return formatCountdown(days);
}

function domainLabel(domain: TrackedDomain, days: number | null) {
  if (domain.domain_status === 'error') return 'Check failed';
  if (domain.domain_status === 'unknown') return 'Unknown';
  return formatCountdown(days);
}

export function DomainList({
  domains,
  onRemove,
}: {
  domains: TrackedDomain[];
  onRemove: (id: string) => void;
}) {
  if (domains.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-zinc-500">
          <GlobeIcon className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium text-gray-700 dark:text-zinc-200">No domains tracked yet</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
          Add your first domain below to start monitoring its SSL certificate and registration.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="grid grid-cols-[1fr,140px,140px,160px,40px] gap-4 border-b border-gray-100 px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-gray-400 dark:border-zinc-800 dark:text-zinc-500">
        <span>Domain</span>
        <span>SSL certificate</span>
        <span>Registration</span>
        <span>Last checked</span>
        <span />
      </div>
      <div className="divide-y divide-gray-100 dark:divide-zinc-800">
        {domains.map((d) => {
          const sslDays = daysUntil(d.ssl_expiry_date);
          const domainDays = daysUntil(d.domain_expiry_date);
          const sslTone = d.ssl_status === 'error' ? 'unknown' : urgencyTone(sslDays);
          const domainTone =
            d.domain_status === 'error' || d.domain_status === 'unknown' ? 'unknown' : urgencyTone(domainDays);

          return (
            <div
              key={d.id}
              className="group grid grid-cols-[1fr,140px,140px,160px,40px] items-center gap-4 px-5 py-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800/60"
            >
              <div className="flex items-center gap-2.5 truncate">
                <GlobeIcon className="h-4 w-4 shrink-0 text-gray-400 dark:text-zinc-500" />
                <span className="truncate text-sm font-medium text-gray-900 dark:text-zinc-100">{d.domain}</span>
              </div>
              <div>
                <StatusBadge tone={sslTone} label={sslLabel(d, sslDays)} />
              </div>
              <div>
                <StatusBadge tone={domainTone} label={domainLabel(d, domainDays)} />
              </div>
              <span className="truncate text-xs text-gray-500 dark:text-zinc-400">
                {d.checked_at ? new Date(d.checked_at).toLocaleDateString() : 'Pending'}
              </span>
              <button
                onClick={() => onRemove(d.id)}
                aria-label={`Remove ${d.domain}`}
                className="justify-self-end rounded-md p-1.5 text-gray-300 opacity-0 transition-colors hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:text-zinc-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
