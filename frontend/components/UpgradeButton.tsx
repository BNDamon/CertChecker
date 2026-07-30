'use client';

import { useState } from 'react';
import { createCheckoutSession } from '@/lib/api';

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
      className="rounded-md border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50"
    >
      {loading ? 'Redirecting...' : 'Upgrade to Pro -- $15/mo'}
    </button>
  );
}
