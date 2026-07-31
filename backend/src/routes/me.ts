import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { env } from '../config/env';
import { normalizeThresholds, MAX_CUSTOM_THRESHOLDS } from '../services/thresholds';
import { sendWebhookAlert } from '../services/webhook';

export const meRouter = Router();
meRouter.use(requireAuth);

async function getSubscriptionStatus(userId: string): Promise<string> {
  const { rows } = await pool.query(`select subscription_status from public.users where id = $1`, [userId]);
  return rows[0]?.subscription_status ?? 'free';
}

meRouter.get('/', asyncHandler(async (req, res) => {
  const { rows: userRows } = await pool.query(
    `select subscription_status, webhook_url, alert_thresholds from public.users where id = $1`,
    [req.user!.id]
  );
  const user = userRows[0];

  const { rows: countRows } = await pool.query(
    `select count(*)::int as count from public.tracked_domains where user_id = $1`,
    [req.user!.id]
  );

  res.json({
    email: req.user!.email,
    subscriptionStatus: user?.subscription_status ?? 'free',
    domainCount: countRows[0].count,
    freeTierDomainLimit: env.freeTierDomainLimit,
    webhookUrl: user?.webhook_url ?? null,
    alertThresholds: user?.alert_thresholds ?? null,
  });
}));

meRouter.patch('/thresholds', asyncHandler(async (req, res) => {
  const subscriptionStatus = await getSubscriptionStatus(req.user!.id);
  if (subscriptionStatus !== 'active') {
    return res.status(403).json({ error: 'Custom alert thresholds are a Pro feature' });
  }

  // null resets to the default 30/14/7/1 schedule.
  if (req.body?.thresholds === null) {
    await pool.query(`update public.users set alert_thresholds = null where id = $1`, [req.user!.id]);
    return res.json({ alertThresholds: null });
  }

  const thresholds = normalizeThresholds(req.body?.thresholds);
  if (!thresholds) {
    return res.status(400).json({
      error: `Provide 1-${MAX_CUSTOM_THRESHOLDS} distinct whole numbers of days, each between 1 and 365`,
    });
  }

  await pool.query(`update public.users set alert_thresholds = $1 where id = $2`, [thresholds, req.user!.id]);
  res.json({ alertThresholds: thresholds });
}));

meRouter.patch('/webhook', asyncHandler(async (req, res) => {
  const subscriptionStatus = await getSubscriptionStatus(req.user!.id);
  if (subscriptionStatus !== 'active') {
    return res.status(403).json({ error: 'Webhook alerts are a Pro feature' });
  }

  const raw = req.body?.webhookUrl;
  if (raw !== null && typeof raw !== 'string') {
    return res.status(400).json({ error: 'webhookUrl must be a string or null' });
  }

  let webhookUrl: string | null = null;
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = new URL(raw.trim());
      if (parsed.protocol !== 'https:') throw new Error('not https');
      webhookUrl = parsed.toString();
    } catch {
      return res.status(400).json({ error: 'Provide a valid https:// webhook URL' });
    }
  }

  await pool.query(`update public.users set webhook_url = $1 where id = $2`, [webhookUrl, req.user!.id]);
  res.json({ webhookUrl });
}));

meRouter.post('/webhook/test', asyncHandler(async (req, res) => {
  const subscriptionStatus = await getSubscriptionStatus(req.user!.id);
  if (subscriptionStatus !== 'active') {
    return res.status(403).json({ error: 'Webhook alerts are a Pro feature' });
  }

  const { rows } = await pool.query(`select webhook_url from public.users where id = $1`, [req.user!.id]);
  const webhookUrl: string | null = rows[0]?.webhook_url ?? null;
  if (!webhookUrl) {
    return res.status(400).json({ error: 'Save a webhook URL first' });
  }

  try {
    await sendWebhookAlert({
      url: webhookUrl,
      domain: 'example.com',
      kind: 'ssl',
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      daysRemaining: 7,
      thresholdDays: 7,
    });
  } catch (err) {
    return res.status(502).json({ error: err instanceof Error ? err.message : 'Webhook request failed' });
  }

  res.json({ ok: true });
}));
