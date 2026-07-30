'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getDomainDetail, type DomainDetail } from '@/lib/api';
import { daysUntil, urgencyTone, formatCountdown } from '@/lib/expiry';
import { StatusBadge } from '@/components/StatusBadge';
import { GlobeIcon, ShieldIcon } from '@/components/icons';

export default function DomainDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<DomainDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDomainDetail(params.id)
      .then(setDetail)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load domain'))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <p className="text-sm text-slate-400">Loading…</p>;

  if (error || !detail) {
    return (
      <div>
        <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 ring-1 ring-inset ring-red-500/20">
          {error ?? 'Domain not found'}
        </p>
        <button onClick={() => router.push('/dashboard')} className="text-sm text-accent-400 hover:text-accent-300">
          ← Back to domains
        </button>
      </div>
    );
  }

  const latest = detail.history[0];
  const sslDays = latest ? daysUntil(latest.ssl_expiry_date) : null;
  const domainDays = latest ? daysUntil(latest.domain_expiry_date) : null;

  return (
    <>
      <button
        onClick={() => router.push('/dashboard')}
        className="mb-4 text-sm text-slate-400 transition-colors hover:text-slate-200"
      >
        ← Back to domains
      </button>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
          <GlobeIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">{detail.domain.domain}</h1>
          <p className="text-xs text-slate-400">
            Tracked since {new Date(detail.domain.added_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
            <ShieldIcon className="h-4 w-4 text-slate-400" />
            SSL certificate
          </div>
          {latest ? (
            <>
              <StatusBadge
                tone={latest.ssl_status === 'error' ? 'unknown' : urgencyTone(sslDays)}
                label={latest.ssl_status === 'error' ? 'Check failed' : formatCountdown(sslDays)}
              />
              {latest.ssl_expiry_date && (
                <p className="mt-2 text-xs text-slate-500">
                  Expires {new Date(latest.ssl_expiry_date).toLocaleDateString()}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-500">No checks yet</p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
            <GlobeIcon className="h-4 w-4 text-slate-400" />
            Domain registration
          </div>
          {latest ? (
            <>
              <StatusBadge
                tone={
                  latest.domain_status === 'error' || latest.domain_status === 'unknown'
                    ? 'unknown'
                    : urgencyTone(domainDays)
                }
                label={
                  latest.domain_status === 'error'
                    ? 'Check failed'
                    : latest.domain_status === 'unknown'
                      ? 'Unknown'
                      : formatCountdown(domainDays)
                }
              />
              {latest.domain_expiry_date && (
                <p className="mt-2 text-xs text-slate-500">
                  Expires {new Date(latest.domain_expiry_date).toLocaleDateString()}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-500">No checks yet</p>
          )}
        </div>
      </div>

      <h2 className="mb-3 text-sm font-semibold text-white">Check history</h2>
      {detail.history.length === 0 ? (
        <p className="text-sm text-slate-400">No checks have run yet -- the daily job hasn&apos;t reached this domain.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
          <div className="grid grid-cols-[160px,1fr,1fr] gap-4 border-b border-slate-800 px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-slate-500">
            <span>Checked</span>
            <span>SSL certificate</span>
            <span>Registration</span>
          </div>
          <div className="divide-y divide-slate-800/80">
            {detail.history.map((h) => {
              const hSslDays = daysUntil(h.ssl_expiry_date);
              const hDomainDays = daysUntil(h.domain_expiry_date);
              return (
                <div key={h.checked_at} className="grid grid-cols-[160px,1fr,1fr] items-center gap-4 px-5 py-3">
                  <span className="text-xs text-slate-500">{new Date(h.checked_at).toLocaleString()}</span>
                  <StatusBadge
                    tone={h.ssl_status === 'error' ? 'unknown' : urgencyTone(hSslDays)}
                    label={h.ssl_status === 'error' ? 'Check failed' : formatCountdown(hSslDays)}
                  />
                  <StatusBadge
                    tone={h.domain_status === 'error' || h.domain_status === 'unknown' ? 'unknown' : urgencyTone(hDomainDays)}
                    label={
                      h.domain_status === 'error'
                        ? 'Check failed'
                        : h.domain_status === 'unknown'
                          ? 'Unknown'
                          : formatCountdown(hDomainDays)
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
