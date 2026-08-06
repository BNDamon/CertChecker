import Link from 'next/link';
import { ShieldIcon } from '@/components/icons';

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'support@example.com';
const LAST_UPDATED = 'August 2026';

export default function PrivacyPage() {
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
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-white">Privacy Policy</h1>
        <p className="mb-8 text-sm text-slate-500">Last updated {LAST_UPDATED}</p>

        <div className="mb-8 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200/90">
          This is a general-purpose draft, not legal advice tailored to your business. Have a lawyer review it
          before relying on it for a paid, public product.
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-slate-300">
          <section>
            <h2 className="mb-2 text-base font-semibold text-white">1. What we collect</h2>
            <ul className="ml-4 list-disc space-y-1.5">
              <li>Account info: your email address and password (password is hashed by our auth provider; we never see it in plain text).</li>
              <li>The domains you add to track, any client label you give them, and the SSL/registration check results we record for them.</li>
              <li>Billing status (plan, subscription status) and a Stripe customer reference -- we never see or store your card details; Stripe handles that directly.</li>
              <li>If you use Pro features: a webhook URL you provide, and any custom alert thresholds you set.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-white">2. How we use it</h2>
            <p>
              Solely to run the service: checking your domains daily, sending you expiry alerts by email (and
              webhook, if configured), and showing you your dashboard. We don&apos;t sell your data or use it for
              advertising.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-white">3. Who we share it with</h2>
            <p>We use a small number of infrastructure providers to run CertChecker, each processing only what they need to do their job:</p>
            <ul className="ml-4 mt-2 list-disc space-y-1.5">
              <li><span className="text-slate-200">Supabase</span> -- authentication and database storage.</li>
              <li><span className="text-slate-200">Stripe</span> -- payment processing and billing.</li>
              <li><span className="text-slate-200">Resend</span> -- delivering alert emails.</li>
            </ul>
            <p className="mt-2">We don&apos;t share your data with anyone else, except where required by law.</p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-white">4. Public status pages</h2>
            <p>
              Enabling a public status page for a domain is opt-in and per-domain. When enabled, the domain name and
              its current SSL/registration status become visible to anyone with the link -- no account data, email,
              or other domains are exposed. You can disable it at any time, which invalidates the link.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-white">5. Data retention and deletion</h2>
            <p>
              We keep your data for as long as your account is active. To delete your account and associated data,
              email us at{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-accent-400 hover:text-accent-300">
                {SUPPORT_EMAIL}
              </a>{' '}
              and we&apos;ll process the request promptly.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-white">6. Cookies and local storage</h2>
            <p>
              We use browser local storage to keep you signed in between visits. We don&apos;t use advertising or
              cross-site tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-white">7. Security</h2>
            <p>
              Data is encrypted in transit (HTTPS) and at rest via our database provider. No method of storage or
              transmission is 100% secure, but we take reasonable measures to protect your data.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-white">8. Children&apos;s privacy</h2>
            <p>CertChecker isn&apos;t directed at children, and we don&apos;t knowingly collect data from anyone under 16.</p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-white">9. Changes</h2>
            <p>We may update this policy as the product changes. Material changes will be reflected here with an updated date.</p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-white">10. Contact</h2>
            <p>
              Questions about this policy, or to request your data or its deletion:{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-accent-400 hover:text-accent-300">
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
