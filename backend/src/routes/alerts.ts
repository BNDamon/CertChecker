import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

export const alertsRouter = Router();
alertsRouter.use(requireAuth);

alertsRouter.get('/', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `select sa.id, sa.alert_type, sa.threshold_days, sa.sent_at, d.domain, d.id as domain_id
     from public.sent_alerts sa
     join public.tracked_domains d on d.id = sa.domain_id
     where d.user_id = $1
     order by sa.sent_at desc
     limit 100`,
    [req.user!.id]
  );

  res.json({ alerts: rows });
}));
