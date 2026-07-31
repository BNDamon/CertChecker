export type WebhookAlertKind = 'ssl' | 'domain';

interface SendWebhookAlertArgs {
  url: string;
  domain: string;
  kind: WebhookAlertKind;
  expiryDate: Date;
  daysRemaining: number;
  thresholdDays: number;
}

/**
 * Posts a Slack-compatible payload (`{ text }`) to a user-supplied webhook
 * URL. Slack's incoming webhooks read exactly this shape, and most other
 * webhook receivers (Discord via a compatibility endpoint, generic HTTP
 * logging tools) tolerate an unrecognized JSON body fine, so one payload
 * shape covers the common cases without per-provider branching.
 */
export async function sendWebhookAlert({
  url,
  domain,
  kind,
  expiryDate,
  daysRemaining,
  thresholdDays,
}: SendWebhookAlertArgs): Promise<void> {
  const label = kind === 'ssl' ? 'SSL certificate' : 'domain registration';
  const text =
    daysRemaining <= 0
      ? `:rotating_light: *${domain}* -- ${label} has expired.`
      : `:warning: *${domain}* -- ${label} expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} (${thresholdDays}-day threshold), on ${expiryDate.toUTCString()}.`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    throw new Error(`Webhook responded with ${res.status}`);
  }
}
