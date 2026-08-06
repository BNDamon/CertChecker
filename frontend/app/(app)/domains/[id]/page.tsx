'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getDomainDetail, type CheckResult } from '@/lib/api';
import { useMe } from '@/lib/useMe';
import { daysUntil, urgencyTone, formatCountdown } from '@/lib/expiry';
import { StatusBadge } from '@/components/StatusBadge';
import { Pagination } from '@/components/Pagination';
import { InlineLabel } from '@/components/InlineLabel';
import { SharePanel } from '@/components/SharePanel';
import { GlobeIcon, ShieldIcon } from '@/components/icons';

const PAGE_SIZE = 10;

export default function DomainDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const { me } = useMe();

  const [domainInfo, setDomainInfo] = useState<{
    id: string;
    domain: string;
    label: string | null;
    added_at: string;
    share_token: string | null;
  } | null>(null);
  // The most recent check, independent of which history page is showing --
  // the status cards up top should always reflect "now", not whatever page
  // of history the user happens to be looking at.
  const [latestCheck, setLatestCheck] = useState<CheckResult | null>(null);

  const [history, setHistory] = useState<CheckResult[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDomainDetail(params.id, 1, 1)
      .then((res) => {
        setDomainInfo(res.domain);
        setLatestCheck(res.history[0] ?? null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load domain'));
  }, [params.id]);

  const refreshHistory = useCallback(
    async (targetPage: number) => {
      setLoading(true);
      try {
        const res = await getDomainDetail(params.id, targetPage, PAGE_SIZE);
        setHistory(res.history);
        setTotal(res.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load domain');
      } finally {
        setLoading(false);
      }
    },
    [params.id]
  );

  useEffect(() => {
    refreshHistory(page);
  }, [page, refreshHistory]);

  if (error || (!loading && !domainInfo)) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 ring-1 ring-inset ring-red-500/20">
          {error ?? 'Domain not found'}
        </p>
        <button onClick={() => router.push('/dashboard')} className="text-sm text-accent-400 hover:text-accent-300">
          ← Back to domains
        </button>
      </div>
    );
  }

  const sslDays = latestCheck ? daysUntil(latestCheck.ssl_expiry_date) : null;
  const domainDays = latestCheck ? daysUntil(latestCheck.domain_expiry_date) : null;

  return (
    <div className="mx-auto max-w-3xl">
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
          <h1 className="text-xl font-semibold tracking-tight text-white">{domainInfo?.domain}</h1>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Tracked since {domainInfo ? new Date(domainInfo.added_at).toLocaleDateString() : '…'}</span>
            {domainInfo && (
              <>
                <span>·</span>
                <InlineLabel
                  domainId={domainInfo.id}
                  label={domainInfo.label}
                  onSaved={(updated) => setDomainInfo((prev) => (prev ? { ...prev, ...updated } : prev))}
                />
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
            <ShieldIcon className="h-4 w-4 text-slate-400" />
            SSL certificate
          </div>
          {latestCheck ? (
            <>
              <StatusBadge
                tone={latestCheck.ssl_status === 'error' ? 'unknown' : urgencyTone(sslDays)}
                label={latestCheck.ssl_status === 'error' ? 'Check failed' : formatCountdown(sslDays)}
              />
              {latestCheck.ssl_expiry_date && (
                <p className="mt-2 text-xs text-slate-500">
                  Expires {new Date(latestCheck.ssl_expiry_date).toLocaleDateString()}
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
          {latestCheck ? (
            <>
              <StatusBadge
                tone={
                  latestCheck.domain_status === 'error' || latestCheck.domain_status === 'unknown'
                    ? 'unknown'
                    : urgencyTone(domainDays)
                }
                label={
                  latestCheck.domain_status === 'error'
                    ? 'Check failed'
                    : latestCheck.domain_status === 'unknown'
                      ? 'Unknown'
                      : formatCountdown(domainDays)
                }
              />
              {latestCheck.domain_expiry_date && (
                <p className="mt-2 text-xs text-slate-500">
                  Expires {new Date(latestCheck.domain_expiry_date).toLocaleDateString()}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-500">No checks yet</p>
          )}
        </div>
      </div>

      {domainInfo && (
        <SharePanel
          domainId={domainInfo.id}
          shareToken={domainInfo.share_token}
          isPro={me?.subscriptionStatus === 'active'}
          onChange={(token) => setDomainInfo((prev) => (prev ? { ...prev, share_token: token } : prev))}
        />
      )}

      <h2 className="mb-3 text-sm font-semibold text-white">Check history</h2>
      {!loading && history.length === 0 ? (
        <p className="text-sm text-slate-400">No checks have run yet -- the daily job hasn&apos;t reached this domain.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
          <div className="hidden gap-4 border-b border-slate-800 px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-slate-500 sm:grid sm:grid-cols-[160px,1fr,1fr]">
            <span>Checked</span>
            <span>SSL certificate</span>
            <span>Registration</span>
          </div>
          <div className="divide-y divide-slate-800/80">
            {history.map((h) => {
              const hSslDays = daysUntil(h.ssl_expiry_date);
              const hDomainDays = daysUntil(h.domain_expiry_date);
              return (
                <div
                  key={h.checked_at}
                  className="flex flex-col gap-2 px-4 py-3 sm:grid sm:grid-cols-[160px,1fr,1fr] sm:items-center sm:gap-4 sm:px-5"
                >
                  <span className="text-xs text-slate-500">{new Date(h.checked_at).toLocaleString()}</span>
                  <div className="flex items-center justify-between sm:block">
                    <span className="text-xs text-slate-500 sm:hidden">SSL certificate</span>
                    <StatusBadge
                      tone={h.ssl_status === 'error' ? 'unknown' : urgencyTone(hSslDays)}
                      label={h.ssl_status === 'error' ? 'Check failed' : formatCountdown(hSslDays)}
                    />
                  </div>
                  <div className="flex items-center justify-between sm:block">
                    <span className="text-xs text-slate-500 sm:hidden">Registration</span>
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
                </div>
              );
            })}
          </div>
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
