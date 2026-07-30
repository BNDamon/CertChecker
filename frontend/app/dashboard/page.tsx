'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/useSession';
import { supabase } from '@/lib/supabaseClient';
import { listDomains, removeDomain, type TrackedDomain } from '@/lib/api';
import { DomainList } from '@/components/DomainList';
import { AddDomainForm } from '@/components/AddDomainForm';
import { UpgradeButton } from '@/components/UpgradeButton';

// Per-user dashboard driven entirely by client-side session state -- skip
// build-time prerendering rather than have it fail when Supabase env vars
// aren't available at build time.
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();
  const [domains, setDomains] = useState<TrackedDomain[]>([]);
  const [loadingDomains, setLoadingDomains] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoadingDomains(true);
    try {
      const { domains } = await listDomains();
      setDomains(domains);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load domains');
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
    return <main className="p-8 text-sm text-gray-500">Loading...</main>;
  }

  async function handleRemove(id: string) {
    await removeDomain(id);
    refresh();
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tracked domains</h1>
          <p className="text-sm text-gray-500">{session.user.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <UpgradeButton />
          <button onClick={handleSignOut} className="text-sm text-gray-500 hover:underline">
            Sign out
          </button>
        </div>
      </div>

      <div className="mb-6">
        <AddDomainForm onAdded={refresh} />
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loadingDomains ? (
        <p className="text-sm text-gray-500">Loading domains...</p>
      ) : (
        <DomainList domains={domains} onRemove={handleRemove} />
      )}
    </main>
  );
}
