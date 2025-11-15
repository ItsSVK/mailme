import express, { Router } from 'express';
import { prisma } from '../prisma';
import { simpleParser } from 'mailparser';

const router = Router();

/**
 * Helper function to save email to database
 * Shared between forwardemail and resend webhooks
 */
async function saveEmail(
  from: string,
  to: string,
  subject: string | null,
  text: string | null,
  html: string | null,
  domain: string
) {
  const toAddress = typeof to === 'string' ? to : '';

  // Check if the email is for our domain
  if (!toAddress.endsWith(`@${domain}`)) {
    throw new Error(`Email not for domain ${domain}`);
  }

  const username = toAddress.split('@')[0]?.trim();

  if (!username) {
    throw new Error('Could not extract username from email address');
  }

  console.log(`[Webhook] Processing email for username: ${username}`);

  // Find or create mailbox
  let mailbox = await prisma.mailbox.findUnique({
    where: { username },
  });

  if (!mailbox) {
    console.log(`[Webhook] Mailbox not found for ${username}, returning null`);
    return null;
  }

  // Prepare email data
  const fromText = typeof from === 'string' ? from : 'unknown';
  const subjectText = subject && typeof subject === 'string' ? subject : null;
  const textContent = text && typeof text === 'string' ? text : null;
  const htmlContent = html && typeof html === 'string' ? html : null;

  // Use text as raw if available, otherwise use html, otherwise empty string
  const rawContent = textContent || htmlContent || '';

  // Save email to database
  await prisma.email.create({
    data: {
      mailboxId: mailbox.id,
      to: toAddress,
      from: fromText,
      subject: subjectText,
      text: textContent,
      html: htmlContent,
      raw: rawContent,
    },
  });

  console.log(
    `[Webhook] ✅ Saved email for ${username}: ${subjectText ?? '<no-subject>'}`
  );

  return username;
}

/**
 * POST /webhook/cloudflare
 * Accept raw RFC822 email from a Cloudflare Email Worker
 *
 * Configure your Worker to POST the raw message with:
 *  - Content-Type: message/rfc822
 *  - Authorization: Bearer <WEBHOOK_SECRET> (optional)
 *  - X-Email-To / X-Email-From (optional hints; raw is parsed server-side)
 */
router.post(
  '/cloudflare',
  // Route-level raw body parser so we can feed it to mailparser
  express.raw({ type: '*/*', limit: '15mb' }),
  async (req, res) => {
    try {
      // Optional webhook secret verification (reuse WEBHOOK_SECRET)
      const webhookSecret = process.env.WEBHOOK_SECRET;
      if (webhookSecret) {
        const providedSecret =
          req.headers.authorization?.replace('Bearer ', '') ||
          (req.query.secret as string);

        if (providedSecret !== webhookSecret) {
          console.warn('[Webhook] ⚠️ Invalid webhook secret (cloudflare)');
          return res.status(401).json({ error: 'Unauthorized' });
        }
      }

      if (!req.body || !(req.body instanceof Buffer)) {
        console.warn('[Webhook] Missing raw body for Cloudflare email');
        return res.status(400).json({ error: 'Missing raw body' });
      }

      const parsed = await simpleParser(req.body as Buffer);

      // Extract fields similar to SMTP flow
      const toValue = Array.isArray(parsed.to) ? parsed.to[0] : parsed.to;
      const toAddress = toValue?.value?.[0]?.address ?? '';
      const fromValue = Array.isArray(parsed.from)
        ? parsed.from[0]
        : parsed.from;
      const fromText =
        fromValue?.text ?? fromValue?.value?.[0]?.address ?? 'unknown';

      const subject = parsed.subject ?? null;
      const text = parsed.text ?? null;
      const html =
        parsed.html && typeof parsed.html === 'string' ? parsed.html : null;

      if (!fromText || !toAddress) {
        console.warn(
          '[Webhook] Missing from/to after parsing Cloudflare email'
        );
        return res
          .status(400)
          .json({ error: 'Missing required fields: from and to' });
      }

      const domain = process.env.DOMAIN ?? 'mailme.local';
      const username = await saveEmail(
        fromText,
        toAddress,
        subject,
        text,
        html,
        domain
      );

      if (username === null) {
        return res
          .status(200)
          .json({ success: false, error: 'Mailbox not found' });
      } else {
        return res.status(200).json({
          success: true,
          message: 'Email received and processed',
          username,
        });
      }
    } catch (err) {
      console.error('[Webhook] ❌ Error processing Cloudflare email:', err);
      return res.status(500).json({
        error: 'Internal server error',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }
);

export default router;
