'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getPublicStatus, type PublicDomainStatus } from '@/lib/api';
import { daysUntil, urgencyTone, formatCountdown } from '@/lib/expiry';
import { StatusBadge } from '@/components/StatusBadge';
import { ShieldIcon, GlobeIcon } from '@/components/icons';

// Public, unauthenticated page -- no session lookup, so it must not sit
// under the (app) route group's auth-guarded layout.
export const dynamic = 'force-dynamic';

export default function PublicStatusPage() {
  const params = useParams<{ token: string }>();
  const [status, setStatus] = useState<PublicDomainStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPublicStatus(params.token)
      .then((res) => setStatus(res.status))
      .catch((err) => setError(err instanceof Error ? err.message : 'Status page not found'));
  }, [params.token]);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-slate-400">{error}</p>
      </main>
    );
  }

  if (!status) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-slate-400">Loading…</p>
      </main>
    );
  }

  const sslDays = daysUntil(status.ssl_expiry_date);
  const domainDays = daysUntil(status.domain_expiry_date);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/40">
          <div className="mb-5 flex items-center gap-2.5">
            <GlobeIcon className="h-5 w-5 text-slate-400" />
            <div>
              <h1 className="text-base font-semibold text-white">{status.domain}</h1>
              {status.label && <p className="text-xs text-slate-400">{status.label}</p>}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-slate-950/40 px-3 py-2.5">
              <span className="text-sm text-slate-300">SSL certificate</span>
              <StatusBadge
                tone={status.ssl_status === 'error' ? 'unknown' : urgencyTone(sslDays)}
                label={status.ssl_status === 'error' ? 'Unknown' : formatCountdown(sslDays)}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-950/40 px-3 py-2.5">
              <span className="text-sm text-slate-300">Domain registration</span>
              <StatusBadge
                tone={
                  status.domain_status === 'error' || status.domain_status === 'unknown'
                    ? 'unknown'
                    : urgencyTone(domainDays)
                }
                label={
                  status.domain_status === 'error' || status.domain_status === 'unknown'
                    ? 'Unknown'
                    : formatCountdown(domainDays)
                }
              />
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-slate-500">
            {status.checked_at ? `Last checked ${new Date(status.checked_at).toLocaleString()}` : 'Not yet checked'}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <ShieldIcon className="h-3.5 w-3.5" />
          Monitored by CertChecker
        </div>
      </div>
    </main>
  );
}
