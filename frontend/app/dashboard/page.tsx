'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/useSession';
import { supabase } from '@/lib/supabaseClient';
import { listDomains, removeDomain, getMe, type TrackedDomain, type MeInfo } from '@/lib/api';
import { daysUntil, mostUrgentDays } from '@/lib/expiry';
import { DomainList } from '@/components/DomainList';
import { AddDomainForm } from '@/components/AddDomainForm';
import { UsageBar } from '@/components/UsageBar';
import { StatCard } from '@/components/StatCard';
import { NextUpCard } from '@/components/NextUpCard';
import { Sidebar } from '@/components/Sidebar';
import { SparklesIcon, GlobeIcon, AlertTriangleIcon, XCircleIcon } from '@/components/icons';

// Per-user dashboard driven entirely by client-side session state -- skip
// build-time prerendering rather than have it fail when Supabase env vars
// aren't available at build time.
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();
  const [domains, setDomains] = useState<TrackedDomain[]>([]);
  const [me, setMe] = useState<MeInfo | null>(null);
  const [loadingDomains, setLoadingDomains] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoadingDomains(true);
    try {
      const [{ domains }, meInfo] = await Promise.all([listDomains(), getMe()]);
      setDomains(domains);
      setMe(meInfo);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load your domains');
    } finally {
      setLoadingDomains(false);
    }
  }, []);

  useEffect(() => {
    if (!sessionLoading && !session) {
      router.push('/login');
    }
  }, [sessionLoading, session, router]);

  useEffect(() => {
    if (session) refresh();
  }, [session, refresh]);

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

  const stats = useMemo(() => {
    let expiringSoon = 0;
    let expired = 0;
    for (const d of domains) {
      const days = mostUrgentDays(daysUntil(d.ssl_expiry_date), daysUntil(d.domain_expiry_date));
      if (days === null) continue;
      if (days < 0) expired++;
      else if (days <= 30) expiringSoon++;
    }
    return { total: domains.length, expiringSoon, expired };
  }, [domains]);

  const nextUp = useMemo(() => {
    const top = sortedDomains[0];
    if (!top) return null;
    const sslDays = daysUntil(top.ssl_expiry_date);
    const domainDays = daysUntil(top.domain_expiry_date);
    const sslRank = sslDays === null ? Infinity : sslDays;
    const domainRank = domainDays === null ? Infinity : domainDays;
    if (sslRank === Infinity && domainRank === Infinity) return null;
    return sslRank <= domainRank
      ? { domain: top.domain, kind: 'ssl' as const, days: sslDays }
      : { domain: top.domain, kind: 'domain' as const, days: domainDays };
  }, [sortedDomains]);

  if (sessionLoading || !session) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-400">Loading…</p>
      </main>
    );
  }

  async function handleRemove(id: string) {
    await removeDomain(id);
    refresh();
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  const isPro = me?.subscriptionStatus === 'active';

  return (
    <div className="flex min-h-screen">
      <Sidebar email={session.user.email ?? ''} isPro={isPro} onSignOut={handleSignOut} />

      <main className="flex-1 px-8 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-white">Tracked domains</h1>
            {me && !isPro && <UsageBar count={me.domainCount} limit={me.freeTierDomainLimit} />}
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Tracked domains" value={stats.total} icon={GlobeIcon} tone="default" />
            <StatCard label="Expiring soon" value={stats.expiringSoon} icon={AlertTriangleIcon} tone="warning" />
            <StatCard label="Expired" value={stats.expired} icon={XCircleIcon} tone="danger" />
            <StatCard
              label={isPro ? 'Plan' : 'Free tier usage'}
              value={isPro ? 'Pro' : `${me?.domainCount ?? 0}/${me?.freeTierDomainLimit ?? '–'}`}
              icon={SparklesIcon}
              tone="accent"
            />
          </div>

          {nextUp && <NextUpCard domain={nextUp.domain} kind={nextUp.kind} days={nextUp.days} />}

          <div className="mb-6">
            <AddDomainForm onAdded={refresh} />
          </div>

          {error && (
            <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 ring-1 ring-inset ring-red-500/20">
              {error}
            </p>
          )}

          {loadingDomains ? (
            <p className="text-sm text-slate-400">Loading domains…</p>
          ) : (
            <DomainList domains={sortedDomains} onRemove={handleRemove} />
          )}
        </div>
      </main>
    </div>
  );
}
