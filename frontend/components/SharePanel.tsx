'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toggleDomainShare } from '@/lib/api';

export function SharePanel({
  domainId,
  shareToken,
  isPro,
  onChange,
}: {
  domainId: string;
  shareToken: string | null;
  isPro: boolean;
  onChange: (token: string | null) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      const { shareToken: token } = await toggleDomainShare(domainId, !shareToken);
      onChange(token);
    } finally {
      setLoading(false);
    }
  }

  function copyLink(url: string) {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!isPro) {
    return (
      <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="mb-1 text-sm font-semibold text-white">Public status page</h2>
        <p className="text-sm text-slate-400">
          Share a read-only status link with clients.{' '}
          <Link href="/billing" className="text-accent-400 hover:text-accent-300">
            Upgrade to Pro
          </Link>{' '}
          to enable it.
        </p>
      </div>
    );
  }

  const url = shareToken && typeof window !== 'undefined' ? `${window.location.origin}/status/${shareToken}` : '';

  return (
    <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">Public status page</h2>
          <p className="text-xs text-slate-400">Share a read-only link with clients.</p>
        </div>
        <button
          onClick={toggle}
          disabled={loading}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            shareToken
              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              : 'bg-gradient-to-r from-accent-500 to-teal-600 text-white hover:opacity-90'
          }`}
        >
          {loading ? 'Please wait…' : shareToken ? 'Disable' : 'Enable'}
        </button>
      </div>

      {shareToken && (
        <div className="mt-3 flex items-center gap-2">
          <input
            readOnly
            value={url}
            onFocus={(e) => e.target.select()}
            className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-300"
          />
          <button
            onClick={() => copyLink(url)}
            className="shrink-0 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      )}
    </div>
  );
}
