'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/useSession';
import { supabase } from '@/lib/supabaseClient';
import { listDomains, removeDomain, getMe, type TrackedDomain, type MeInfo } from '@/lib/api';
import { daysUntil, mostUrgentDays } from '@/lib/expiry';
import { DomainList } from '@/components/DomainList';
import { AddDomainForm } from '@/components/AddDomainForm';
import { UpgradeButton } from '@/components/UpgradeButton';
import { UsageBar } from '@/components/UsageBar';
import { StatCard } from '@/components/StatCard';
import { ShieldIcon, SparklesIcon, GlobeIcon, AlertTriangleIcon, XCircleIcon } from '@/components/icons';

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
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent-500 to-indigo-600 text-white">
              <ShieldIcon className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-white">CertChecker</span>
          </div>
          <div className="flex items-center gap-3">
            {isPro && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-500/10 px-2.5 py-1 text-xs font-medium text-accent-300 ring-1 ring-inset ring-accent-500/25">
                <SparklesIcon className="h-3.5 w-3.5" />
                Pro
              </span>
            )}
            {!isPro && <UpgradeButton />}
            <button onClick={handleSignOut} className="text-sm text-slate-400 transition-colors hover:text-slate-200">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white">Tracked domains</h1>
            <p className="mt-0.5 text-sm text-slate-400">{session.user.email}</p>
          </div>
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
      </main>
    </div>
  );
}
