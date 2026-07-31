'use client';

import { useState, FormEvent } from 'react';
import { updateWebhook, testWebhook } from '@/lib/api';

export function WebhookSettings({
  webhookUrl,
  onSaved,
}: {
  webhookUrl: string | null;
  onSaved: (webhookUrl: string | null) => void;
}) {
  const [url, setUrl] = useState(webhookUrl ?? '');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const { webhookUrl: saved } = await updateWebhook(url.trim() || null);
      onSaved(saved);
      setSuccess('Webhook saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save webhook');
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setError(null);
    setSuccess(null);
    setTesting(true);
    try {
      await testWebhook();
      setSuccess('Test message sent -- check your Slack channel or endpoint');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test send failed');
    } finally {
      setTesting(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="max-w-sm">
      <label className="mb-1.5 block text-sm font-medium text-slate-300">Slack / webhook URL</label>
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://hooks.slack.com/services/…"
        className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/30"
      />
      <p className="mt-1.5 text-xs text-slate-500">
        Alerts post here in addition to email. Works with Slack incoming webhooks, or any https:// endpoint that
        accepts a JSON <code className="text-slate-400">{'{ text }'}</code> body.
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

      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-gradient-to-r from-accent-500 to-teal-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-accent-600/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={handleTest}
          disabled={testing || !webhookUrl}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {testing ? 'Sending…' : 'Send test'}
        </button>
      </div>
    </form>
  );
}
