import { Router } from 'express';
import crypto from 'node:crypto';
import { pool } from '../db/pool';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { env } from '../config/env';
import { normalizeThresholds, MAX_CUSTOM_THRESHOLDS } from '../services/thresholds';
import { sendWebhookAlert } from '../services/webhook';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ALERT_RECIPIENTS = 5;
const MAX_BRAND_NAME_LENGTH = 60;

export const meRouter = Router();
meRouter.use(requireAuth);

async function getSubscriptionStatus(userId: string): Promise<string> {
  const { rows } = await pool.query(`select subscription_status from public.users where id = $1`, [userId]);
  return rows[0]?.subscription_status ?? 'free';
}

meRouter.get('/', asyncHandler(async (req, res) => {
  const { rows: userRows } = await pool.query(
    `select subscription_status, webhook_url, alert_thresholds, alert_recipients, brand_name, api_key
     from public.users where id = $1`,
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
    alertRecipients: user?.alert_recipients ?? null,
    brandName: user?.brand_name ?? null,
    apiKey: user?.api_key ?? null,
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

meRouter.patch('/recipients', asyncHandler(async (req, res) => {
  const subscriptionStatus = await getSubscriptionStatus(req.user!.id);
  if (subscriptionStatus !== 'active') {
    return res.status(403).json({ error: 'Multiple alert recipients are a Pro feature' });
  }

  if (req.body?.recipients === null) {
    await pool.query(`update public.users set alert_recipients = null where id = $1`, [req.user!.id]);
    return res.json({ alertRecipients: null });
  }

  const raw = req.body?.recipients;
  if (!Array.isArray(raw)) {
    return res.status(400).json({ error: 'recipients must be an array of emails, or null' });
  }

  const recipients = Array.from(
    new Set(raw.map((r) => (typeof r === 'string' ? r.trim().toLowerCase() : '')).filter((r) => r))
  );

  if (recipients.length === 0 || recipients.length > MAX_ALERT_RECIPIENTS) {
    return res.status(400).json({ error: `Provide 1-${MAX_ALERT_RECIPIENTS} email addresses` });
  }
  if (!recipients.every((r) => EMAIL_RE.test(r))) {
    return res.status(400).json({ error: 'One or more entries is not a valid email address' });
  }

  await pool.query(`update public.users set alert_recipients = $1 where id = $2`, [recipients, req.user!.id]);
  res.json({ alertRecipients: recipients });
}));

meRouter.patch('/brand', asyncHandler(async (req, res) => {
  const subscriptionStatus = await getSubscriptionStatus(req.user!.id);
  if (subscriptionStatus !== 'active') {
    return res.status(403).json({ error: 'White-label status pages are a Pro feature' });
  }

  const raw = req.body?.brandName;
  if (raw !== null && typeof raw !== 'string') {
    return res.status(400).json({ error: 'brandName must be a string or null' });
  }

  const brandName = typeof raw === 'string' && raw.trim() ? raw.trim().slice(0, MAX_BRAND_NAME_LENGTH) : null;

  await pool.query(`update public.users set brand_name = $1 where id = $2`, [brandName, req.user!.id]);
  res.json({ brandName });
}));

meRouter.post('/api-key', asyncHandler(async (req, res) => {
  const subscriptionStatus = await getSubscriptionStatus(req.user!.id);
  if (subscriptionStatus !== 'active') {
    return res.status(403).json({ error: 'API access is a Pro feature' });
  }

  const apiKey = `cck_${crypto.randomBytes(24).toString('hex')}`;
  await pool.query(`update public.users set api_key = $1 where id = $2`, [apiKey, req.user!.id]);
  res.json({ apiKey });
}));

meRouter.delete('/api-key', asyncHandler(async (req, res) => {
  await pool.query(`update public.users set api_key = null where id = $1`, [req.user!.id]);
  res.json({ apiKey: null });
}));
