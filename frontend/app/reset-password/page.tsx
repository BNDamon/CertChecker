'use client';

import { Suspense, useEffect, useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ShieldIcon } from '@/components/icons';

// Reached via the link in a Supabase password-reset email. Modern Supabase
// projects use the PKCE flow for this, which redirects here with a `?code=`
// param that must be explicitly exchanged for a session via
// exchangeCodeForSession -- the client's automatic hash-fragment detection
// (the older implicit flow) never fires for this, so without the exchange
// below, updateUser() fails with "Auth session missing".
export const dynamic = 'force-dynamic';

// useSearchParams requires a Suspense boundary even on a force-dynamic page.
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const code = searchParams.get('code');

    (async () => {
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setLinkError('This reset link is invalid or has expired -- request a new one from the sign-in page.');
          return;
        }
        setReady(true);
        return;
      }

      // Fall back to checking for an already-established session, in case
      // the older hash-fragment flow (#access_token=...&type=recovery) is
      // what this project is configured for instead.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setReady(true);
      } else {
        setLinkError('This reset link is invalid or has expired -- request a new one from the sign-in page.');
      }
    })();
  }, [searchParams]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to reset password -- the link may have expired, request a new one from the sign-in page.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-teal-600 text-white shadow-lg shadow-accent-600/30">
            <ShieldIcon className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-white">Set a new password</h1>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/40 backdrop-blur">
          {linkError ? (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 ring-1 ring-inset ring-red-500/20">
              {linkError}
            </p>
          ) : success ? (
            <p className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-400 ring-1 ring-inset ring-green-500/20">
              Password updated -- redirecting…
            </p>
          ) : !ready ? (
            <p className="text-sm text-slate-400">Verifying your reset link…</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">New password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/30"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Confirm new password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/30"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 ring-1 ring-inset ring-red-500/20">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-gradient-to-r from-accent-500 to-teal-600 py-2.5 text-sm font-medium text-white shadow-lg shadow-accent-600/20 transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent-500/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Updating…' : 'Update password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
