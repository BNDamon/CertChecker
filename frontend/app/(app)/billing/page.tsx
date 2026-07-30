'use client';

import { useState } from 'react';
import { useMe } from '@/lib/useMe';
import { createPortalSession } from '@/lib/api';
import { UpgradeButton } from '@/components/UpgradeButton';
import { UsageBar } from '@/components/UsageBar';
import { SparklesIcon, CheckCircleIcon, CreditCardIcon } from '@/components/icons';

const FREE_FEATURES = ['Track up to 3 domains', 'Daily SSL + registration checks', 'Email alerts at 30/14/7/1 days'];
const PRO_FEATURES = ['Unlimited tracked domains', 'Daily SSL + registration checks', 'Email alerts at 30/14/7/1 days'];

export default function BillingPage() {
  const { me, loading } = useMe();
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleManageSubscription() {
    setPortalLoading(true);
    setError(null);
    try {
      const { url } = await createPortalSession();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open billing portal');
      setPortalLoading(false);
    }
  }

  if (loading || !me) {
    return <p className="text-sm text-slate-400">Loading…</p>;
  }

  const isPro = me.subscriptionStatus === 'active';

  return (
    <>
      <h1 className="mb-6 text-xl font-semibold tracking-tight text-white">Billing</h1>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                isPro
                  ? 'bg-gradient-to-br from-accent-500/20 to-indigo-500/20 text-accent-300'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              <SparklesIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{isPro ? 'Pro plan' : 'Free plan'}</p>
              <p className="text-xs text-slate-400">
                {isPro ? '$15/month · unlimited domains' : `${me.domainCount} / ${me.freeTierDomainLimit} domains used`}
              </p>
            </div>
          </div>
          {!isPro && <UsageBar count={me.domainCount} limit={me.freeTierDomainLimit} />}
        </div>

        <ul className="mb-5 space-y-2">
          {(isPro ? PRO_FEATURES : FREE_FEATURES).map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm text-slate-300">
              <CheckCircleIcon className="h-4 w-4 shrink-0 text-green-400" />
              {feature}
            </li>
          ))}
        </ul>

        {error && (
          <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 ring-1 ring-inset ring-red-500/20">
            {error}
          </p>
        )}

        {isPro ? (
          <button
            onClick={handleManageSubscription}
            disabled={portalLoading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CreditCardIcon className="h-4 w-4" />
            {portalLoading ? 'Opening…' : 'Manage subscription'}
          </button>
        ) : (
          <UpgradeButton />
        )}
      </div>
    </>
  );
}
