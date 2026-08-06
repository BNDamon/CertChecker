'use client';

import { useState } from 'react';
import { bulkAddDomains, type BulkAddResult } from '@/lib/api';

function parseDomainList(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((d) => d.trim())
    .filter(Boolean);
}

export function BulkImportForm({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<BulkAddResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const domains = parseDomainList(text);
    if (domains.length === 0) return;

    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const res = await bulkAddDomains(domains);
      setResult(res);
      setText('');
      if (res.added.length > 0) onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk import failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mb-4 text-xs text-accent-400 hover:text-accent-300"
      >
        Bulk import domains
      </button>
    );
  }

  return (
    <div className="mb-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Bulk import</h3>
        <button onClick={() => setOpen(false)} className="text-xs text-slate-500 hover:text-slate-300">
          Close
        </button>
      </div>
      <p className="mb-2 text-xs text-slate-400">One domain per line (or comma-separated).</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        placeholder={'client-a.com\nclient-b.com\nclient-c.com'}
        className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/30"
      />

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

      {result && (
        <div className="mt-2 space-y-1 text-xs">
          {result.added.length > 0 && <p className="text-green-400">Added {result.added.length} domain(s).</p>}
          {result.skipped.length > 0 && (
            <div className="text-amber-400">
              <p>Skipped {result.skipped.length}:</p>
              <ul className="ml-4 list-disc">
                {result.skipped.map((s) => (
                  <li key={s.domain}>
                    {s.domain} -- {s.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting || parseDomainList(text).length === 0}
        className="mt-3 rounded-lg bg-gradient-to-r from-accent-500 to-teal-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-accent-600/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? 'Importing…' : 'Import domains'}
      </button>
    </div>
  );
}
