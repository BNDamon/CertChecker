'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/useSession';
import { useMe } from '@/lib/useMe';
import { supabase } from '@/lib/supabaseClient';
import { Sidebar } from '@/components/Sidebar';

// Every page under this group needs an active session -- guard once here
// instead of duplicating the redirect-if-signed-out check on every page.
export const dynamic = 'force-dynamic';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();
  const { me } = useMe();

  useEffect(() => {
    if (!sessionLoading && !session) {
      router.push('/login');
    }
  }, [sessionLoading, session, router]);

  if (sessionLoading || !session) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-400">Loading…</p>
      </main>
    );
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar email={session.user.email ?? ''} isPro={me?.subscriptionStatus === 'active'} onSignOut={handleSignOut} />
      <main className="flex-1 px-8 py-8">
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>
    </div>
  );
}
