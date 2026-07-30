'use client';

import { useState } from 'react';
import { createCheckoutSession } from '@/lib/api';
import { SparklesIcon } from './icons';

export function UpgradeButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const { url } = await createCheckoutSession();
      window.location.href = url;
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to start checkout');
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg bg-accent-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-accent-500/40 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <SparklesIcon className="h-4 w-4" />
      {loading ? 'Redirecting…' : 'Upgrade to Pro'}
    </button>
  );
}
