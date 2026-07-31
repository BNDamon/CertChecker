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
import { RecentAlertsPanel } from '@/components/RecentAlertsPanel';
import { domainsToCsv, downloadCsv } from '@/lib/csv';
import { SparklesIcon, GlobeIcon, AlertTriangleIcon, XCircleIcon, SearchIcon, DownloadIcon } from '@/components/icons';

const PAGE_SIZE = 10;

export default function DashboardPage() {
  const { me, refresh: refreshMe } = useMe();
  const [domains, setDomains] = useState<TrackedDomain[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [stats, setStats] = useState<DomainStats | null>(null);
  const [loadingDomains, setLoadingDomains] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Debounce so every keystroke doesn't fire a request -- 300ms feels
  // instant while still collapsing a fast typist into one call.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const refresh = useCallback(async (targetPage: number, q: string) => {
    setLoadingDomains(true);
    try {
      const [domainsRes, statsRes] = await Promise.all([
        listDomains(targetPage, PAGE_SIZE, q),
        getDomainStats(),
      ]);
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
    refresh(page, debouncedSearch);
  }, [page, debouncedSearch, refresh]);

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
    refresh(page, debouncedSearch);
    refreshMe();
  }

  async function handleAdded() {
    setPage(1);
    await refresh(1, debouncedSearch);
    refreshMe();
  }

  function handleDomainUpdated(updated: { id: string; label: string | null }) {
    setDomains((prev) => prev.map((d) => (d.id === updated.id ? { ...d, ...updated } : d)));
  }

  async function handleExportCsv() {
    setExporting(true);
    try {
      const all: TrackedDomain[] = [];
      let p = 1;
      const exportPageSize = 200;
      // Export needs every domain regardless of what's currently paginated
      // on screen, so page through the full list rather than reusing `domains`.
      for (;;) {
        const res = await listDomains(p, exportPageSize, debouncedSearch);
        all.push(...res.domains);
        if (res.domains.length < exportPageSize) break;
        p++;
      }
      downloadCsv(`certchecker-domains-${new Date().toISOString().slice(0, 10)}.csv`, domainsToCsv(all));
    } finally {
      setExporting(false);
    }
  }

  const isPro = me?.subscriptionStatus === 'active';

  return (
    <div className="flex gap-6">
    <div className="min-w-0 flex-1">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-white">Tracked domains</h1>
        <div className="flex items-center gap-3">
          {me && !isPro && <UsageBar count={me.domainCount} limit={me.freeTierDomainLimit} />}
          {isPro && (
            <button
              onClick={handleExportCsv}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <DownloadIcon className="h-3.5 w-3.5" />
              {exporting ? 'Exporting…' : 'Export CSV'}
            </button>
          )}
        </div>
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

      <div className="mb-4">
        <AddDomainForm onAdded={handleAdded} />
      </div>

      <div className="relative mb-4">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by domain or client…"
          className="w-full rounded-lg border border-slate-800 bg-slate-900/60 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/30 sm:max-w-xs"
        />
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
          <DomainList domains={sortedDomains} onRemove={handleRemove} onDomainUpdated={handleDomainUpdated} />
          {total > 0 && (
            <div className="mt-2 rounded-2xl border border-slate-800 bg-slate-900/60">
              <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
            </div>
          )}
        </>
      )}
    </div>
    <RecentAlertsPanel />
    </div>
  );
}
