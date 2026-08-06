import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { env } from '../config/env';
import { parsePagination } from '../utils/pagination';
import { checkOneDomain, type TrackedDomainRow } from '../services/checkDomain';

const CHECK_NOW_COOLDOWN_MS = 5 * 60 * 1000;

export const domainsRouter = Router();
domainsRouter.use(requireAuth);

const HOSTNAME_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/i;

function normalizeDomain(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  return HOSTNAME_RE.test(trimmed) ? trimmed : null;
}

domainsRouter.get('/', asyncHandler(async (req, res) => {
  const { page, pageSize, offset } = parsePagination(req.query, 10);
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const searchParam = `%${q}%`;

  const { rows: countRows } = await pool.query(
    `select count(*)::int as count
     from public.tracked_domains
     where user_id = $1
       and ($2 = '' or domain ilike $3 or label ilike $3)`,
    [req.user!.id, q, searchParam]
  );

  const { rows } = await pool.query(
    `select
       d.id,
       d.domain,
       d.label,
       d.added_at,
       cr.checked_at,
       cr.ssl_expiry_date,
       cr.domain_expiry_date,
       cr.ssl_status,
       cr.domain_status
     from public.tracked_domains d
     left join lateral (
       select * from public.check_results c
       where c.domain_id = d.id
       order by c.checked_at desc
       limit 1
     ) cr on true
     where d.user_id = $1
       and ($2 = '' or d.domain ilike $3 or d.label ilike $3)
     order by d.added_at desc
     limit $4 offset $5`,
    [req.user!.id, q, searchParam, pageSize, offset]
  );

  res.json({ domains: rows, page, pageSize, total: countRows[0].count });
}));

domainsRouter.post('/', asyncHandler(async (req, res) => {
  const domain = typeof req.body?.domain === 'string' ? normalizeDomain(req.body.domain) : null;
  if (!domain) {
    return res.status(400).json({ error: 'Provide a valid domain, e.g. example.com' });
  }

  const label = typeof req.body?.label === 'string' && req.body.label.trim() ? req.body.label.trim() : null;

  const { rows: userRows } = await pool.query(
    `select subscription_status from public.users where id = $1`,
    [req.user!.id]
  );
  const subscriptionStatus = userRows[0]?.subscription_status ?? 'free';

  if (subscriptionStatus !== 'active') {
    const { rows: countRows } = await pool.query(
      `select count(*)::int as count from public.tracked_domains where user_id = $1`,
      [req.user!.id]
    );
    if (countRows[0].count >= env.freeTierDomainLimit) {
      return res.status(403).json({
        error: `Free tier is limited to ${env.freeTierDomainLimit} domains. Upgrade to track more.`,
        code: 'TIER_LIMIT_REACHED',
      });
    }
  }

  try {
    const { rows } = await pool.query(
      `insert into public.tracked_domains (user_id, domain, label)
       values ($1, $2, $3)
       returning id, domain, label, added_at`,
      [req.user!.id, domain, label]
    );
    res.status(201).json({ domain: rows[0] });
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'This domain is already being tracked' });
    }
    throw err;
  }
}));

domainsRouter.post('/bulk', asyncHandler(async (req, res) => {
  const rawDomains = Array.isArray(req.body?.domains) ? req.body.domains : null;
  if (!rawDomains || rawDomains.length === 0) {
    return res.status(400).json({ error: 'Provide a non-empty array of domains' });
  }

  const { rows: userRows } = await pool.query(
    `select subscription_status from public.users where id = $1`,
    [req.user!.id]
  );
  const subscriptionStatus = userRows[0]?.subscription_status ?? 'free';

  const { rows: countRows } = await pool.query(
    `select count(*)::int as count from public.tracked_domains where user_id = $1`,
    [req.user!.id]
  );
  let remaining = subscriptionStatus === 'active' ? Infinity : env.freeTierDomainLimit - countRows[0].count;

  const added: string[] = [];
  const skipped: { domain: string; reason: string }[] = [];

  // Sequential so the free-tier remaining-slot count stays correct as we go,
  // and so one bad row can't abort the rest of an otherwise-valid batch.
  for (const raw of rawDomains) {
    const domain = typeof raw === 'string' ? normalizeDomain(raw) : null;
    if (!domain) {
      skipped.push({ domain: String(raw), reason: 'Invalid domain' });
      continue;
    }
    if (remaining <= 0) {
      skipped.push({ domain, reason: 'Free tier limit reached' });
      continue;
    }

    try {
      await pool.query(`insert into public.tracked_domains (user_id, domain) values ($1, $2)`, [
        req.user!.id,
        domain,
      ]);
      added.push(domain);
      remaining--;
    } catch (err: any) {
      skipped.push({ domain, reason: err.code === '23505' ? 'Already tracked' : 'Failed to add' });
    }
  }

  res.json({ added, skipped });
}));

// Registered before '/:id' -- otherwise Express would match "stats" as an id.
//
// This looks at every one of the user's domains regardless of pagination,
// since the dashboard's summary counts and "next up" highlight need to
// reflect the whole account, not just whatever page of the domain table
// happens to be showing.
domainsRouter.get('/stats', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `select d.id, d.domain, cr.ssl_expiry_date, cr.domain_expiry_date
     from public.tracked_domains d
     left join lateral (
       select ssl_expiry_date, domain_expiry_date from public.check_results c
       where c.domain_id = d.id
       order by c.checked_at desc
       limit 1
     ) cr on true
     where d.user_id = $1`,
    [req.user!.id]
  );

  const now = Date.now();
  const daysUntil = (date: string | null) =>
    date === null ? null : Math.floor((new Date(date).getTime() - now) / 86_400_000);

  let expiringSoon = 0;
  let expired = 0;
  let nextUp: { domain: string; kind: 'ssl' | 'domain'; days: number } | null = null;

  // One bucket per domain (not per check-type) for the health-breakdown chart --
  // takes the worst-case of its SSL and registration status, so these four
  // counts sum to exactly `total` rather than double-counting a domain that's
  // behind on both.
  const healthBreakdown = { healthy: 0, warning: 0, critical: 0, unknown: 0 };

  for (const row of rows) {
    const sslDays = daysUntil(row.ssl_expiry_date);
    const domainDays = daysUntil(row.domain_expiry_date);
    const candidates: { kind: 'ssl' | 'domain'; days: number }[] = [];
    if (sslDays !== null) candidates.push({ kind: 'ssl', days: sslDays });
    if (domainDays !== null) candidates.push({ kind: 'domain', days: domainDays });

    for (const c of candidates) {
      if (c.days < 0) expired++;
      else if (c.days <= 30) expiringSoon++;
      if (nextUp === null || c.days < nextUp.days) {
        nextUp = { domain: row.domain, kind: c.kind, days: c.days };
      }
    }

    const knownDays = candidates.map((c) => c.days);
    if (knownDays.length === 0) {
      healthBreakdown.unknown++;
    } else if (knownDays.some((d) => d < 0)) {
      healthBreakdown.critical++;
    } else if (knownDays.some((d) => d <= 30)) {
      healthBreakdown.warning++;
    } else {
      healthBreakdown.healthy++;
    }
  }

  res.json({ total: rows.length, expiringSoon, expired, nextUp, healthBreakdown });
}));

domainsRouter.get('/:id', asyncHandler(async (req, res) => {
  const { rows: domainRows } = await pool.query(
    `select id, domain, label, added_at, share_token from public.tracked_domains where id = $1 and user_id = $2`,
    [req.params.id, req.user!.id]
  );

  if (domainRows.length === 0) {
    return res.status(404).json({ error: 'Domain not found' });
  }

  const { page, pageSize, offset } = parsePagination(req.query, 10);

  const { rows: countRows } = await pool.query(
    `select count(*)::int as count from public.check_results where domain_id = $1`,
    [req.params.id]
  );

  const { rows: history } = await pool.query(
    `select checked_at, ssl_expiry_date, domain_expiry_date, ssl_status, domain_status
     from public.check_results
     where domain_id = $1
     order by checked_at desc
     limit $2 offset $3`,
    [req.params.id, pageSize, offset]
  );

  res.json({ domain: domainRows[0], history, page, pageSize, total: countRows[0].count });
}));

domainsRouter.patch('/:id', asyncHandler(async (req, res) => {
  const rawLabel = req.body?.label;
  if (rawLabel !== null && typeof rawLabel !== 'string') {
    return res.status(400).json({ error: 'label must be a string or null' });
  }
  const label = typeof rawLabel === 'string' && rawLabel.trim() ? rawLabel.trim() : null;

  const { rows } = await pool.query(
    `update public.tracked_domains
     set label = $1
     where id = $2 and user_id = $3
     returning id, domain, label, added_at`,
    [label, req.params.id, req.user!.id]
  );

  if (rows.length === 0) {
    return res.status(404).json({ error: 'Domain not found' });
  }

  res.json({ domain: rows[0] });
}));

domainsRouter.post('/:id/check', asyncHandler(async (req, res) => {
  const { rows } = await pool.query<TrackedDomainRow>(
    `select d.id, d.domain, d.user_id, u.email, u.subscription_status, u.webhook_url, u.alert_thresholds, u.alert_recipients
     from public.tracked_domains d
     join public.users u on u.id = d.user_id
     where d.id = $1 and d.user_id = $2`,
    [req.params.id, req.user!.id]
  );

  if (rows.length === 0) {
    return res.status(404).json({ error: 'Domain not found' });
  }

  const { rows: lastCheckRows } = await pool.query(
    `select checked_at from public.check_results where domain_id = $1 order by checked_at desc limit 1`,
    [req.params.id]
  );
  const lastCheckedAt = lastCheckRows[0]?.checked_at as string | undefined;
  if (lastCheckedAt) {
    const msSinceLastCheck = Date.now() - new Date(lastCheckedAt).getTime();
    if (msSinceLastCheck < CHECK_NOW_COOLDOWN_MS) {
      const retryAfterSeconds = Math.ceil((CHECK_NOW_COOLDOWN_MS - msSinceLastCheck) / 1000);
      return res.status(429).json({
        error: `This domain was just checked -- try again in ${Math.ceil(retryAfterSeconds / 60)} min.`,
        retryAfterSeconds,
      });
    }
  }

  await checkOneDomain(rows[0]);
  res.json({ ok: true });
}));

domainsRouter.patch('/:id/share', asyncHandler(async (req, res) => {
  const { rows: userRows } = await pool.query(
    `select subscription_status from public.users where id = $1`,
    [req.user!.id]
  );
  if ((userRows[0]?.subscription_status ?? 'free') !== 'active') {
    return res.status(403).json({ error: 'Public status pages are a Pro feature' });
  }

  const enabled = req.body?.enabled === true;

  const { rows } = await pool.query(
    enabled
      ? `update public.tracked_domains
         set share_token = coalesce(share_token, gen_random_uuid())
         where id = $1 and user_id = $2
         returning share_token`
      : `update public.tracked_domains
         set share_token = null
         where id = $1 and user_id = $2
         returning share_token`,
    [req.params.id, req.user!.id]
  );

  if (rows.length === 0) {
    return res.status(404).json({ error: 'Domain not found' });
  }

  res.json({ shareToken: rows[0].share_token });
}));

domainsRouter.delete('/:id', asyncHandler(async (req, res) => {
  const { rowCount } = await pool.query(
    `delete from public.tracked_domains where id = $1 and user_id = $2`,
    [req.params.id, req.user!.id]
  );

  if (rowCount === 0) {
    return res.status(404).json({ error: 'Domain not found' });
  }

  res.status(204).send();
}));
