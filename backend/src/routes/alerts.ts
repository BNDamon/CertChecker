import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { parsePagination } from '../utils/pagination';

export const alertsRouter = Router();
alertsRouter.use(requireAuth);

alertsRouter.get('/', asyncHandler(async (req, res) => {
  const { page, pageSize, offset } = parsePagination(req.query, 20);

  const { rows: countRows } = await pool.query(
    `select count(*)::int as count
     from public.sent_alerts sa
     join public.tracked_domains d on d.id = sa.domain_id
     where d.user_id = $1`,
    [req.user!.id]
  );

  const { rows } = await pool.query(
    `select sa.id, sa.alert_type, sa.threshold_days, sa.sent_at, d.domain, d.id as domain_id
     from public.sent_alerts sa
     join public.tracked_domains d on d.id = sa.domain_id
     where d.user_id = $1
     order by sa.sent_at desc
     limit $2 offset $3`,
    [req.user!.id, pageSize, offset]
  );

  res.json({ alerts: rows, page, pageSize, total: countRows[0].count });
}));

alertsRouter.get('/trend', asyncHandler(async (req, res) => {
  const days = 30;

  const { rows } = await pool.query(
    `select (date_trunc('day', sa.sent_at))::date as day, sa.alert_type, count(*)::int as count
     from public.sent_alerts sa
     join public.tracked_domains d on d.id = sa.domain_id
     where d.user_id = $1 and sa.sent_at >= now() - interval '${days} days'
     group by day, sa.alert_type`,
    [req.user!.id]
  );

  // Build the full day range so the chart has a bar for every day, including
  // zero-alert days, rather than only the days something happened to be sent.
  const byDay = new Map<string, { ssl: number; domain: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - i);
    byDay.set(d.toISOString().slice(0, 10), { ssl: 0, domain: 0 });
  }

  for (const row of rows) {
    const key = new Date(row.day).toISOString().slice(0, 10);
    const bucket = byDay.get(key);
    if (bucket) bucket[row.alert_type as 'ssl' | 'domain'] = row.count;
  }

  const trend = Array.from(byDay.entries()).map(([date, counts]) => ({ date, ...counts }));

  res.json({ trend });
}));
