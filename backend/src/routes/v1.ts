import { Router } from 'express';
import { pool } from '../db/pool';
import { requireApiKey } from '../middleware/apiKeyAuth';
import { asyncHandler } from '../middleware/asyncHandler';

// A small, read-only public API for Pro users' own scripts/tooling --
// authenticated with a personal API key (see /api/me/api-key), not the
// Supabase session JWT the dashboard itself uses.
export const v1Router = Router();
v1Router.use(requireApiKey);

v1Router.get('/domains', asyncHandler(async (req, res) => {
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
     order by d.added_at desc`,
    [req.user!.id]
  );

  res.json({ domains: rows });
}));
