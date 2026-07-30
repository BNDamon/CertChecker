'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { listDomains, removeDomain, getDomainStats, type TrackedDomain, type DomainStats } from '@/lib/api';
import { useMe } from '@/lib/useMe';
import { daysUntil, mostUrgentDays } from '@/lib/expiry';
import { DomainList } from '@/components/DomainList';
import { AddDomainForm } from '@/components/AddDomainForm';
import { UsageBar } from '@/components/UsageBar';
import { StatCard } from '@/components/StatCard';
import { NextUpCard } from '@/components/NextUpCard';
import { Pagination } from '@/components/Pagination';
import { SparklesIcon, GlobeIcon, AlertTriangleIcon, XCircleIcon } from '@/components/icons';

const PAGE_SIZE = 10;

export default function DashboardPage() {
  const { me, refresh: refreshMe } = useMe();
  const [domains, setDomains] = useState<TrackedDomain[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<DomainStats | null>(null);
  const [loadingDomains, setLoadingDomains] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (targetPage: number) => {
    setLoadingDomains(true);
    try {
      const [domainsRes, statsRes] = await Promise.all([listDomains(targetPage, PAGE_SIZE), getDomainStats()]);
      setDomains(domainsRes.domains);
      setTotal(domainsRes.total);
      setStats(statsRes);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load your domains');
    } finally {
      setLoadingDomains(false);
    }
  }, []);

  useEffect(() => {
    refresh(page);
  }, [page, refresh]);

  // Urgency ordering is only meaningful within the current page -- the
  // "next up" card and stat counts (from getDomainStats) already cover the
  // whole account regardless of which page is showing.
  const sortedDomains = useMemo(() => {
    return [...domains].sort((a, b) => {
      const aDays = mostUrgentDays(daysUntil(a.ssl_expiry_date), daysUntil(a.domain_expiry_date));
      const bDays = mostUrgentDays(daysUntil(b.ssl_expiry_date), daysUntil(b.domain_expiry_date));
      if (aDays === null && bDays === null) return 0;
      if (aDays === null) return 1;
      if (bDays === null) return -1;
      return aDays - bDays;
    });
  }, [domains]);

  async function handleRemove(id: string) {
    await removeDomain(id);
    refresh(page);
    refreshMe();
  }

  async function handleAdded() {
    setPage(1);
    await refresh(1);
    refreshMe();
  }

  const isPro = me?.subscriptionStatus === 'active';

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-white">Tracked domains</h1>
        {me && !isPro && <UsageBar count={me.domainCount} limit={me.freeTierDomainLimit} />}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Tracked domains" value={stats?.total ?? 0} icon={GlobeIcon} tone="default" />
        <StatCard label="Expiring soon" value={stats?.expiringSoon ?? 0} icon={AlertTriangleIcon} tone="warning" />
        <StatCard label="Expired" value={stats?.expired ?? 0} icon={XCircleIcon} tone="danger" />
        <StatCard
          label={isPro ? 'Plan' : 'Free tier usage'}
          value={isPro ? 'Pro' : `${me?.domainCount ?? 0}/${me?.freeTierDomainLimit ?? '–'}`}
          icon={SparklesIcon}
          tone="accent"
        />
      </div>

      {stats?.nextUp && (
        <NextUpCard domain={stats.nextUp.domain} kind={stats.nextUp.kind} days={stats.nextUp.days} />
      )}

      <div className="mb-6">
        <AddDomainForm onAdded={handleAdded} />
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 ring-1 ring-inset ring-red-500/20">
          {error}
        </p>
      )}

      {loadingDomains ? (
        <p className="text-sm text-slate-400">Loading domains…</p>
      ) : (
        <>
          <DomainList domains={sortedDomains} onRemove={handleRemove} />
          {total > 0 && (
            <div className="mt-2 rounded-2xl border border-slate-800 bg-slate-900/60">
              <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
            </div>
          )}
        </>
      )}
    </>
  );
}
