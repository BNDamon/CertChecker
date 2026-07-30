import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { env } from '../config/env';

export const meRouter = Router();
meRouter.use(requireAuth);

meRouter.get('/', asyncHandler(async (req, res) => {
  const { rows: userRows } = await pool.query(
    `select subscription_status from public.users where id = $1`,
    [req.user!.id]
  );
  const subscriptionStatus = userRows[0]?.subscription_status ?? 'free';

  const { rows: countRows } = await pool.query(
    `select count(*)::int as count from public.tracked_domains where user_id = $1`,
    [req.user!.id]
  );

  res.json({
    email: req.user!.email,
    subscriptionStatus,
    domainCount: countRows[0].count,
    freeTierDomainLimit: env.freeTierDomainLimit,
  });
}));
