import { Router } from 'express';
import { pool } from '../db/pool';
import { asyncHandler } from '../middleware/asyncHandler';

// Deliberately NOT behind requireAuth -- this is the public, unauthenticated
// status page agencies share with their clients. Looked up by the opaque
// share_token only; the response exposes just the domain name and its
// current check status, never the owning user_id or internal domain id.
export const publicStatusRouter = Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

publicStatusRouter.get('/:token', asyncHandler(async (req, res) => {
  // share_token is a uuid column -- a malformed token would otherwise reach
  // Postgres as an invalid uuid literal and surface as a 500, not a 404.
  if (!UUID_RE.test(req.params.token)) {
    return res.status(404).json({ error: 'Status page not found' });
  }

  const { rows } = await pool.query(
    `select
       d.domain,
       d.label,
       cr.checked_at,
       cr.ssl_expiry_date,
       cr.domain_expiry_date,
       cr.ssl_status,
       cr.domain_status,
       -- White-label branding is a Pro perk -- if the owner has since
       -- downgraded, fall back to the default "Powered by CertChecker"
       -- rather than keep a stale custom brand name showing.
       case when u.subscription_status = 'active' then u.brand_name else null end as brand_name
     from public.tracked_domains d
     join public.users u on u.id = d.user_id
     left join lateral (
       select * from public.check_results c
       where c.domain_id = d.id
       order by c.checked_at desc
       limit 1
     ) cr on true
     where d.share_token = $1`,
    [req.params.token]
  );

  if (rows.length === 0) {
    return res.status(404).json({ error: 'Status page not found' });
  }

  res.json({ status: rows[0] });
}));
