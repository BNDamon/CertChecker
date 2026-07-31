import { Router } from 'express';
import { pool } from '../db/pool';
import { asyncHandler } from '../middleware/asyncHandler';

// Deliberately NOT behind requireAuth -- this is the public, unauthenticated
// status page agencies share with their clients. Looked up by the opaque
// share_token only; the response exposes just the domain name and its
// current check status, never the owning user_id or internal domain id.
export const publicStatusRouter = Router();

publicStatusRouter.get('/:token', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `select
       d.domain,
       d.label,
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
     where d.share_token = $1`,
    [req.params.token]
  );

  if (rows.length === 0) {
    return res.status(404).json({ error: 'Status page not found' });
  }

  res.json({ status: rows[0] });
}));
