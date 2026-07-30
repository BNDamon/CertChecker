import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: parseInt(process.env.PORT ?? '4000', 10),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',

  supabaseUrl: required('SUPABASE_URL'),
  supabaseAnonKey: required('SUPABASE_ANON_KEY'),
  databaseUrl: required('DATABASE_URL'),

  resendApiKey: required('RESEND_API_KEY'),
  alertFromEmail: required('ALERT_FROM_EMAIL'),

  stripeSecretKey: required('STRIPE_SECRET_KEY'),
  stripeWebhookSecret: required('STRIPE_WEBHOOK_SECRET'),
  stripePriceIdPro: required('STRIPE_PRICE_ID_PRO'),

  freeTierDomainLimit: parseInt(process.env.FREE_TIER_DOMAIN_LIMIT ?? '3', 10),
  checkCronSchedule: process.env.CHECK_CRON_SCHEDULE ?? '0 6 * * *',
};
