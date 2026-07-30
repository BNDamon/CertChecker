import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { env } from '../config/env';

export const domainsRouter = Router();
domainsRouter.use(requireAuth);

const HOSTNAME_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/i;

function normalizeDomain(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  return HOSTNAME_RE.test(trimmed) ? trimmed : null;
}

domainsRouter.get('/', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `select
       d.id,
       d.domain,
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
     order by d.added_at desc`,
    [req.user!.id]
  );

  res.json({ domains: rows });
}));

domainsRouter.post('/', asyncHandler(async (req, res) => {
  const domain = typeof req.body?.domain === 'string' ? normalizeDomain(req.body.domain) : null;
  if (!domain) {
    return res.status(400).json({ error: 'Provide a valid domain, e.g. example.com' });
  }

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
      `insert into public.tracked_domains (user_id, domain)
       values ($1, $2)
       returning id, domain, added_at`,
      [req.user!.id, domain]
    );
    res.status(201).json({ domain: rows[0] });
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'This domain is already being tracked' });
    }
    throw err;
  }
}));

domainsRouter.get('/:id', asyncHandler(async (req, res) => {
  const { rows: domainRows } = await pool.query(
    `select id, domain, added_at from public.tracked_domains where id = $1 and user_id = $2`,
    [req.params.id, req.user!.id]
  );

  if (domainRows.length === 0) {
    return res.status(404).json({ error: 'Domain not found' });
  }

  const { rows: history } = await pool.query(
    `select checked_at, ssl_expiry_date, domain_expiry_date, ssl_status, domain_status
     from public.check_results
     where domain_id = $1
     order by checked_at desc
     limit 50`,
    [req.params.id]
  );

  res.json({ domain: domainRows[0], history });
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
