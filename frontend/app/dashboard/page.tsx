'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/useSession';
import { supabase } from '@/lib/supabaseClient';
import { listDomains, removeDomain, getMe, type TrackedDomain, type MeInfo } from '@/lib/api';
import { DomainList } from '@/components/DomainList';
import { AddDomainForm } from '@/components/AddDomainForm';
import { UpgradeButton } from '@/components/UpgradeButton';
import { UsageBar } from '@/components/UsageBar';
import { ShieldIcon, SparklesIcon } from '@/components/icons';

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

  if (sessionLoading || !session) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-500 dark:text-zinc-400">Loading…</p>
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
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-600 text-white">
              <ShieldIcon className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">CertChecker</span>
          </div>
          <div className="flex items-center gap-3">
            {isPro && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-50 px-2.5 py-1 text-xs font-medium text-accent-700 ring-1 ring-inset ring-accent-600/20 dark:bg-accent-500/10 dark:text-accent-300 dark:ring-accent-500/20">
                <SparklesIcon className="h-3.5 w-3.5" />
                Pro
              </span>
            )}
            {!isPro && <UpgradeButton />}
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-500 transition-colors hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Tracked domains</h1>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-zinc-400">{session.user.email}</p>
          </div>
          {me && !isPro && <UsageBar count={me.domainCount} limit={me.freeTierDomainLimit} />}
        </div>

        <div className="mb-6">
          <AddDomainForm onAdded={refresh} />
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </p>
        )}

        {loadingDomains ? (
          <p className="text-sm text-gray-500 dark:text-zinc-400">Loading domains…</p>
        ) : (
          <DomainList domains={domains} onRemove={handleRemove} />
        )}
      </main>
    </div>
  );
}
