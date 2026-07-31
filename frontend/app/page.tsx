import Link from 'next/link';
import { ShieldIcon, GlobeIcon, BellIcon, CheckCircleIcon, SparklesIcon } from '@/components/icons';

const FEATURES = [
  {
    icon: ShieldIcon,
    title: 'SSL certificate monitoring',
    description: "Know the moment a client's certificate is about to expire, not after their site starts throwing browser warnings.",
  },
  {
    icon: GlobeIcon,
    title: 'Domain registration tracking',
    description: 'Catch a lapsed domain registration before it lapses -- and before a client asks you why their site is down.',
  },
  {
    icon: BellIcon,
    title: 'Email alerts that give you time',
    description: 'Automatic notices at 30, 14, 7, and 1 days out, so there is always a real window to renew before anything breaks.',
  },
  {
    icon: CheckCircleIcon,
    title: 'One dashboard, every client site',
    description: 'Stop checking each site by hand. Track every domain you manage in one place, sorted by what needs attention first.',
  },
];

const FREE_FEATURES = ['Up to 3 tracked domains', 'Daily SSL + registration checks', 'Email alerts at 30/14/7/1 days'];
const PRO_FEATURES = ['Unlimited tracked domains', 'Daily SSL + registration checks', 'Email alerts at 30/14/7/1 days'];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent-500 to-teal-600 text-white">
            <ShieldIcon className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-white">CertChecker</span>
        </div>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/support" className="text-slate-400 transition-colors hover:text-slate-200">
            Support
          </Link>
          <Link href="/login" className="text-slate-400 transition-colors hover:text-slate-200">
            Sign in
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4">
        <section className="flex flex-col items-center py-20 text-center">
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-accent-500/10 px-3 py-1 text-xs font-medium text-accent-300 ring-1 ring-inset ring-accent-500/25">
            <SparklesIcon className="h-3.5 w-3.5" />
            Built for freelancers &amp; agencies
          </span>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Never let a client&apos;s SSL certificate or domain expire again
          </h1>
          <p className="mt-5 max-w-xl text-lg text-slate-400">
            CertChecker watches every domain you manage and emails you well before an SSL certificate or domain
            registration lapses -- so you find out from us, not from an angry client.
          </p>
          <div className="mt-8 flex items-center gap-3">
            <Link
              href="/login?mode=sign-up"
              className="rounded-lg bg-gradient-to-r from-accent-500 to-teal-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-accent-600/20 transition-opacity hover:opacity-90"
            >
              Get started free
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800"
            >
              Sign in
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 py-12 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mb-1.5 text-sm font-semibold text-white">{title}</h3>
              <p className="text-sm text-slate-400">{description}</p>
            </div>
          ))}
        </section>

        <section className="py-12">
          <h2 className="mb-8 text-center text-2xl font-semibold tracking-tight text-white">Simple pricing</h2>
          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <p className="text-sm font-medium text-slate-300">Free</p>
              <p className="mt-1 text-3xl font-semibold text-white">
                $0<span className="text-base font-normal text-slate-500">/mo</span>
              </p>
              <ul className="mt-5 space-y-2">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircleIcon className="h-4 w-4 shrink-0 text-green-400" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-accent-500/30 bg-slate-900/60 p-6 shadow-lg shadow-accent-600/10">
              <p className="text-sm font-medium text-accent-300">Pro</p>
              <p className="mt-1 text-3xl font-semibold text-white">
                $15<span className="text-base font-normal text-slate-500">/mo</span>
              </p>
              <ul className="mt-5 space-y-2">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircleIcon className="h-4 w-4 shrink-0 text-green-400" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-5xl items-center justify-between px-4 py-8 text-xs text-slate-500">
        <span>&copy; {new Date().getFullYear()} CertChecker</span>
        <Link href="/support" className="hover:text-slate-300">
          Support
        </Link>
      </footer>
    </div>
  );
}
