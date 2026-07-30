'use client';

import Link from 'next/link';
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
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-14 text-center">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-slate-500">
          <GlobeIcon className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium text-slate-200">No domains tracked yet</p>
        <p className="mt-1 text-sm text-slate-400">
          Add your first domain below to start monitoring its SSL certificate and registration.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl shadow-black/20">
      <div className="grid grid-cols-[1fr,140px,140px,120px,40px] gap-4 border-b border-slate-800 px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-slate-500">
        <span>Domain</span>
        <span>SSL certificate</span>
        <span>Registration</span>
        <span>Last checked</span>
        <span />
      </div>
      <div className="divide-y divide-slate-800/80">
        {domains.map((d) => {
          const sslDays = daysUntil(d.ssl_expiry_date);
          const domainDays = daysUntil(d.domain_expiry_date);
          const sslTone = d.ssl_status === 'error' ? 'unknown' : urgencyTone(sslDays);
          const domainTone =
            d.domain_status === 'error' || d.domain_status === 'unknown' ? 'unknown' : urgencyTone(domainDays);

          return (
            <div
              key={d.id}
              className="group grid grid-cols-[1fr,140px,140px,120px,40px] items-center gap-4 px-5 py-3.5 transition-colors hover:bg-slate-800/40"
            >
              <Link href={`/domains/${d.id}`} className="flex items-center gap-2.5 truncate hover:underline">
                <GlobeIcon className="h-4 w-4 shrink-0 text-slate-500" />
                <span className="truncate text-sm font-medium text-slate-100">{d.domain}</span>
              </Link>
              <div>
                <StatusBadge tone={sslTone} label={sslLabel(d, sslDays)} />
              </div>
              <div>
                <StatusBadge tone={domainTone} label={domainLabel(d, domainDays)} />
              </div>
              <span className="truncate text-xs text-slate-500">
                {d.checked_at ? new Date(d.checked_at).toLocaleDateString() : 'Pending'}
              </span>
              <button
                onClick={() => onRemove(d.id)}
                aria-label={`Remove ${d.domain}`}
                className="justify-self-end rounded-md p-1.5 text-slate-600 opacity-0 transition-colors hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
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
