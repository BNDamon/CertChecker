import { Resend } from 'resend';
import { env } from '../config/env';

const resend = new Resend(env.resendApiKey);

export type AlertKind = 'ssl' | 'domain';

interface SendExpiryAlertArgs {
  to: string;
  domain: string;
  kind: AlertKind;
  expiryDate: Date;
  daysRemaining: number;
  thresholdDays: number;
}

export async function sendExpiryAlert({
  to,
  domain,
  kind,
  expiryDate,
  daysRemaining,
  thresholdDays,
}: SendExpiryAlertArgs): Promise<void> {
  const label = kind === 'ssl' ? 'SSL certificate' : 'domain registration';
  const urgency = daysRemaining <= 1 ? 'urgent' : daysRemaining <= 7 ? 'warning' : 'notice';

  const subject =
    daysRemaining <= 0
      ? `[Expired] ${label} for ${domain} has expired`
      : `[${thresholdDays} day${thresholdDays === 1 ? '' : 's'}] ${label} for ${domain} is expiring soon`;

  const html = `
    <div style="font-family: sans-serif; max-width: 480px;">
      <h2 style="margin-bottom: 4px;">${domain}</h2>
      <p style="color: ${urgency === 'urgent' ? '#dc2626' : urgency === 'warning' ? '#d97706' : '#2563eb'};">
        ${label} ${daysRemaining <= 0 ? 'has expired' : `expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`}.
      </p>
      <p>Expiry date: <strong>${expiryDate.toUTCString()}</strong></p>
      <p style="color: #6b7280; font-size: 13px;">Sent by your certificate &amp; domain expiry monitor.</p>
    </div>
  `;

  await resend.emails.send({
    from: env.alertFromEmail,
    to,
    subject,
    html,
  });
}
