'use client';

import { Suspense, useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ShieldIcon } from '@/components/icons';

// This page reads/writes client-side auth state and has no useful static
// version -- skip build-time prerendering rather than have it fail when
// Supabase env vars aren't available at build time.
export const dynamic = 'force-dynamic';

type Mode = 'sign-in' | 'sign-up' | 'forgot';

// useSearchParams requires a Suspense boundary even on a force-dynamic page --
// without it, Next's build-time prerender pass for this route fails outright.
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>(searchParams.get('mode') === 'sign-up' ? 'sign-up' : 'sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);

    try {
      if (mode === 'sign-in') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/dashboard');
      } else if (mode === 'sign-up') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setInfo('Check your email to confirm your account, then sign in.');
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setInfo('Check your email for a password reset link.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(next: Mode) {
    if (next === mode) return;
    setMode(next);
    setError(null);
    setInfo(null);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-teal-600 text-white shadow-lg shadow-accent-600/30">
            <ShieldIcon className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-white">CertChecker</h1>
          <p className="mt-1 text-sm text-slate-400">SSL &amp; domain expiry monitoring</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/40 backdrop-blur">
          {mode !== 'forgot' && (
            <div className="mb-6 grid grid-cols-2 rounded-lg bg-slate-800/60 p-1 text-sm font-medium">
              <button
                type="button"
                onClick={() => switchMode('sign-in')}
                className={`rounded-md py-1.5 transition-colors ${
                  mode === 'sign-in' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => switchMode('sign-up')}
                className={`rounded-md py-1.5 transition-colors ${
                  mode === 'sign-up' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign up
              </button>
            </div>
          )}

          {mode === 'forgot' && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-white">Reset your password</h2>
              <p className="mt-1 text-sm text-slate-400">We&apos;ll email you a link to choose a new one.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/30"
                placeholder="you@company.com"
              />
            </div>

            {mode !== 'forgot' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/30"
                  placeholder="••••••••"
                />
                {mode === 'sign-in' && (
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="mt-1.5 text-xs text-accent-400 hover:text-accent-300"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
            )}

            {error && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 ring-1 ring-inset ring-red-500/20">
                {error}
              </p>
            )}
            {info && (
              <p className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-400 ring-1 ring-inset ring-green-500/20">
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-gradient-to-r from-accent-500 to-teal-600 py-2.5 text-sm font-medium text-white shadow-lg shadow-accent-600/20 transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent-500/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? 'Please wait…'
                : mode === 'sign-in'
                  ? 'Sign in'
                  : mode === 'sign-up'
                    ? 'Create account'
                    : 'Send reset link'}
            </button>

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => switchMode('sign-in')}
                className="w-full text-center text-sm text-slate-400 hover:text-slate-200"
              >
                ← Back to sign in
              </button>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}
