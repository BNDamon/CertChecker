'use client';

import { useState } from 'react';
import { updateAlertRecipients } from '@/lib/api';

export function AlertRecipientsEditor({
  recipients,
  onSaved,
}: {
  recipients: string[] | null;
  onSaved: (recipients: string[] | null) => void;
}) {
  const [value, setValue] = useState((recipients ?? []).join(', '));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setError(null);
    setSuccess(null);
    const list = value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);

    setSaving(true);
    try {
      const { alertRecipients } = await updateAlertRecipients(list.length > 0 ? list : null);
      onSaved(alertRecipients);
      setValue((alertRecipients ?? []).join(', '));
      setSuccess('Recipients updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update recipients');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-sm">
      <label className="mb-1.5 block text-sm font-medium text-slate-300">Additional recipient emails</label>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="teammate@agency.com, other@agency.com"
        className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/30"
      />
      <p className="mt-1.5 text-xs text-slate-500">
        Comma-separated, up to 5. Alerts always go to your account email too.
      </p>

      {error && (
        <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 ring-1 ring-inset ring-red-500/20">
          {error}
        </p>
      )}
      {success && (
        <p className="mt-3 rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-400 ring-1 ring-inset ring-green-500/20">
          {success}
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-3 rounded-lg bg-gradient-to-r from-accent-500 to-teal-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-accent-600/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}
