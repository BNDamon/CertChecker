import Link from 'next/link';
import { ShieldIcon } from '@/components/icons';

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'support@example.com';

const FAQS = [
  {
    q: 'How often are my domains checked?',
    a: 'A daily job checks every tracked domain once per day: its SSL certificate (via a direct TLS connection) and its registration expiry (via WHOIS). You can also see the exact time of the last check on each domain’s detail page.',
  },
  {
    q: 'When do I get emailed?',
    a: 'You get an alert at 30, 14, 7, and 1 days before an SSL certificate or domain registration expires. Each threshold only emails once, so you won’t get the same warning every day between milestones.',
  },
  {
    q: 'A domain shows "Unknown" for registration -- why?',
    a: 'WHOIS has no single standard format across registries. Many ccTLDs either omit expiry dates entirely or require a different lookup method. When we can’t confidently parse an expiry date, we show "Unknown" rather than guessing.',
  },
  {
    q: 'How many domains can I track for free?',
    a: 'The free plan covers up to 3 domains. Upgrading to Pro ($15/mo) removes that limit entirely.',
  },
  {
    q: 'How do I upgrade, downgrade, or cancel?',
    a: 'Go to Billing in the sidebar. Free-tier accounts see an upgrade button; Pro accounts see a "Manage subscription" button that opens Stripe’s billing portal, where you can update payment details, view invoices, or cancel.',
  },
  {
    q: 'I forgot my password -- what do I do?',
    a: 'On the sign-in page, click "Forgot password?" and enter your email. We’ll send a link to set a new one.',
  },
];

export default function SupportPage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent-500 to-teal-600 text-white">
            <ShieldIcon className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-white">CertChecker</span>
        </Link>
        <Link href="/login" className="text-sm text-slate-400 transition-colors hover:text-slate-200">
          Sign in
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-white">Support</h1>
        <p className="mb-8 text-sm text-slate-400">Answers to common questions, plus how to reach us directly.</p>

        <div className="space-y-3">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="group rounded-xl border border-slate-800 bg-slate-900/60 p-4 open:pb-4">
              <summary className="cursor-pointer list-none text-sm font-medium text-white marker:content-none">
                <span className="flex items-center justify-between gap-3">
                  {q}
                  <span className="shrink-0 text-slate-500 transition-transform group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-2.5 text-sm text-slate-400">{a}</p>
            </details>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center">
          <h2 className="mb-1.5 text-sm font-semibold text-white">Still need help?</h2>
          <p className="mb-4 text-sm text-slate-400">Send us an email and we&apos;ll get back to you.</p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-accent-500 to-teal-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-accent-600/20 transition-opacity hover:opacity-90"
          >
            {SUPPORT_EMAIL}
          </a>
        </div>
      </main>
    </div>
  );
}
