# CertChecker

Tracks SSL certificate and domain registration expiry for tracked domains, and
emails alerts at 30/14/7/1 days out.

- `backend/` -- Node.js + TypeScript + Express API, Postgres (Supabase), daily
  cron check, Resend email alerts, Stripe billing.
- `frontend/` -- Next.js (App Router) + Tailwind dashboard, Supabase Auth
  (email/password).

## 1. Supabase project

1. Create a project at supabase.com.
2. In the SQL editor, run [`backend/src/db/migrations/001_init.sql`](backend/src/db/migrations/001_init.sql).
3. Under **Authentication -> Providers**, email/password is enabled by default.
   For local dev you may want to disable "Confirm email" so sign-up works
   without SMTP configured.
4. Grab from **Project Settings**:
   - API -> Project URL and `anon` public key
   - Database -> Connection string (URI) -- used as `DATABASE_URL`

## 2. Resend

Create an API key at resend.com and verify a sending domain (or use their
test/sandbox sender for local dev).

## 3. Stripe

1. Create a **Product** with a recurring $15/mo **Price**; copy the price ID.
2. Create a webhook endpoint pointing at `http://localhost:4000/api/stripe/webhook`
   (use the Stripe CLI locally: `stripe listen --forward-to localhost:4000/api/stripe/webhook`)
   and copy the signing secret it prints.

## 4. Backend setup

```bash
cd backend
cp .env.example .env   # fill in the values from steps 1-3
npm install
npm run dev
```

Runs on `http://localhost:4000`. To run a single check pass immediately
(without waiting for the cron schedule):

```bash
npm run check:once
```

## 5. Frontend setup

```bash
cd frontend
cp .env.local.example .env.local   # fill in Supabase URL/anon key + API URL
npm install
npm run dev
```

Runs on `http://localhost:3000`.

## Core loop to verify end-to-end

1. Sign up on `/login`, confirm the email if confirmation is enabled.
2. Add a domain (e.g. `example.com`) on `/dashboard`.
3. Run `npm run check:once` in `backend/` -- it should insert a `check_results`
   row and, if any threshold is crossed, send a Resend email.
4. Refresh the dashboard -- countdowns should populate, color-coded by
   urgency (green > 30d, amber <= 30d, red <= 7d or expired).
5. Click "Upgrade to Pro" -- should redirect to Stripe Checkout; completing
   a test-mode payment should flip `subscription_status` to `active` via the
   webhook, lifting the 3-domain free-tier cap.

## Known v1 limitations (by design, to revisit)

- **WHOIS parsing** (`backend/src/services/whoisCheck.ts`) has no universal
  schema across TLDs. gTLDs (.com/.net/.org/.io/.dev) work reasonably well;
  many ccTLDs either omit expiry dates or need RDAP instead of raw WHOIS.
  Unparseable responses are stored as `domain_status: 'unknown'` rather than
  guessed.
- The daily job checks domains **sequentially** to avoid getting the server's
  IP rate-limited by WHOIS servers -- fine at v1 scale, will need
  concurrency + backoff once domain counts grow.
- Dashboard auth guarding is client-side only (redirects if no session) --
  no SSR/middleware-level route protection yet.
- No RLS-authenticated Postgres role for the API; the backend connects with a
  privileged connection string and enforces `user_id` filters in application
  code. RLS policies are enabled on the tables as defense in depth for any
  direct PostgREST access, but aren't the backend's primary authorization
  mechanism.
