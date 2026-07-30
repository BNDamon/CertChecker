import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { env } from '../config/env';
import { pool } from '../db/pool';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

export const stripe = new Stripe(env.stripeSecretKey);

// Mounted with requireAuth + normal JSON body parsing.
export const stripeRouter = Router();
stripeRouter.use(requireAuth);

stripeRouter.post('/create-checkout-session', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `select stripe_customer_id from public.users where id = $1`,
    [req.user!.id]
  );
  const existingCustomerId: string | undefined = rows[0]?.stripe_customer_id;

  // Stripe rejects the request if both `customer` and `customer_email` keys
  // are present, even if one's value is undefined -- so build the params
  // conditionally rather than always including both.
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: env.stripePriceIdPro, quantity: 1 }],
    ...(existingCustomerId ? { customer: existingCustomerId } : { customer_email: req.user!.email }),
    client_reference_id: req.user!.id,
    success_url: `${env.frontendUrl}/dashboard?checkout=success`,
    cancel_url: `${env.frontendUrl}/dashboard?checkout=cancelled`,
  });

  res.json({ url: session.url });
}));

// NOT mounted under stripeRouter/requireAuth -- Stripe calls this directly and
// signature verification (below) is the auth for this endpoint. It must
// receive the raw request body, so it's wired up in index.ts with
// express.raw() BEFORE the global express.json() middleware runs.
export async function stripeWebhookHandler(req: Request, res: Response) {
  const signature = req.headers['stripe-signature'];
  if (!signature) {
    return res.status(400).send('Missing stripe-signature header');
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, env.stripeWebhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return res.status(400).send(`Webhook signature verification failed: ${message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
      if (userId && customerId) {
        await pool.query(
          `update public.users set stripe_customer_id = $1, subscription_status = 'active' where id = $2`,
          [customerId, userId]
        );
      }
      break;
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
      const status = subscription.status === 'active' || subscription.status === 'trialing' ? 'active' : 'canceled';
      await pool.query(
        `update public.users set subscription_status = $1 where stripe_customer_id = $2`,
        [status, customerId]
      );
      break;
    }

    default:
      break;
  }

  res.json({ received: true });
}
