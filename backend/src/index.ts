import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { domainsRouter } from './routes/domains';
import { meRouter } from './routes/me';
import { alertsRouter } from './routes/alerts';
import { publicStatusRouter } from './routes/publicStatus';
import { stripeRouter, stripeWebhookHandler } from './routes/stripe';
import { scheduleDailyCheck } from './jobs/dailyCheck';
import { asyncHandler } from './middleware/asyncHandler';

const app = express();

app.use(cors({ origin: env.frontendUrl }));

// Must be registered with the raw body BEFORE express.json() below --
// Stripe's signature verification needs the exact bytes it sent, not a
// re-serialized parsed object.
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), asyncHandler(stripeWebhookHandler));

app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/domains', domainsRouter);
app.use('/api/me', meRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/public/status', publicStatusRouter);
app.use('/api/stripe', stripeRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(env.port, () => {
  console.log(`API listening on http://localhost:${env.port}`);
  scheduleDailyCheck();
});
