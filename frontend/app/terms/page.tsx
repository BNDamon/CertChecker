import Link from 'next/link';
import { ShieldIcon } from '@/components/icons';

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'support@example.com';
const LAST_UPDATED = 'August 2026';

export default function TermsPage() {
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
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-white">Terms of Service</h1>
        <p className="mb-8 text-sm text-slate-500">Last updated {LAST_UPDATED}</p>

        <div className="mb-8 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200/90">
          This is a general-purpose draft, not legal advice tailored to your business. Have a lawyer review it
          before relying on it for a paid, public product.
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-slate-300">
          <section>
            <h2 className="mb-2 text-base font-semibold text-white">1. The service</h2>
            <p>
              CertChecker monitors SSL certificate and domain registration expiry for domains you add, and emails
              (and, on the Pro plan, sends webhook) alerts as they approach expiry. It is provided on an "as is"
              basis, and monitoring is best-effort, not a guarantee -- see Section 5.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-white">2. Accounts</h2>
            <p>
              You&apos;re responsible for the accuracy of the domains you add and for keeping your account
              credentials secure. You must be legally able to enter into these terms to create an account.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-white">3. Plans and billing</h2>
            <p>
              The free plan tracks up to 3 domains. The Pro plan ($15/month, billed via Stripe) removes that limit
              and adds custom alert thresholds, webhook alerts, public status pages, and CSV export. Subscriptions
              renew automatically each billing period until cancelled. You can cancel anytime from the Billing page,
              which opens Stripe&apos;s billing portal -- cancellation takes effect at the end of the current billing
              period, and we don&apos;t provide partial refunds for unused time.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-white">4. Acceptable use</h2>
            <p>
              Don&apos;t use the service to monitor domains you have no legitimate reason to track, to abuse or
              overload the domains/registries being checked, or to attempt to access other users&apos; data. We may
              suspend or terminate accounts that violate this.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-white">5. No guarantee of accuracy</h2>
            <p>
              SSL checks rely on live TLS connections and WHOIS lookups rely on registry responses that vary
              wildly in format across TLDs -- some registries omit expiry dates entirely, in which case we show
              &quot;Unknown&quot; rather than guess. We do our best to check daily and alert on time, but we don&apos;t
              guarantee an alert will reach you before something expires, and you remain responsible for your own
              renewals. Don&apos;t rely on CertChecker as your only safeguard against an outage.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-white">6. Public status pages</h2>
            <p>
              If you enable a public status page for a domain, anyone with that link can view its SSL and
              registration status without signing in. You control when this is on or off; disabling it invalidates
              the link.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-white">7. Limitation of liability</h2>
            <p>
              To the extent permitted by law, CertChecker isn&apos;t liable for indirect, incidental, or
              consequential damages -- including lost business or downtime -- arising from use of, or inability to
              use, the service.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-white">8. Changes</h2>
            <p>
              We may update these terms as the product changes. Material changes will be reflected here with an
              updated date.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-white">9. Contact</h2>
            <p>
              Questions about these terms:{' '}
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
