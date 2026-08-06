'use client';

import { useState } from 'react';
import { generateApiKey, revokeApiKey } from '@/lib/api';

export function ApiKeyManager({
  apiKey,
  onChange,
}: {
  apiKey: string | null;
  onChange: (apiKey: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setBusy(true);
    setError(null);
    try {
      const { apiKey } = await generateApiKey();
      onChange(apiKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate key');
    } finally {
      setBusy(false);
    }
  }

  async function handleRevoke() {
    setBusy(true);
    setError(null);
    try {
      await revokeApiKey();
      onChange(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke key');
    } finally {
      setBusy(false);
    }
  }

  function copyKey() {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="max-w-sm">
      {apiKey ? (
        <>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={apiKey}
              onFocus={(e) => e.target.select()}
              className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-300"
            />
            <button
              onClick={copyKey}
              className="shrink-0 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            Use as <code className="text-slate-400">Authorization: Bearer &lt;key&gt;</code> against{' '}
            <code className="text-slate-400">GET /api/v1/domains</code>.
          </p>
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          <button
            onClick={handleRevoke}
            disabled={busy}
            className="mt-3 rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? 'Please wait…' : 'Revoke key'}
          </button>
        </>
      ) : (
        <>
          <p className="mb-3 text-sm text-slate-400">No API key yet.</p>
          {error && <p className="mb-2 text-sm text-red-400">{error}</p>}
          <button
            onClick={handleGenerate}
            disabled={busy}
            className="rounded-lg bg-gradient-to-r from-accent-500 to-teal-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-accent-600/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? 'Generating…' : 'Generate API key'}
          </button>
        </>
      )}
    </div>
  );
}
