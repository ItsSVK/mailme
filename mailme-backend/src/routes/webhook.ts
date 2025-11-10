import { Router } from 'express';
import { createHmac } from 'crypto';
import { prisma } from '../prisma';

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
    console.log(`[Webhook] Creating mailbox for ${username}`);
    mailbox = await prisma.mailbox.create({
      data: {
        username,
        domain,
      },
    });
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
 * POST /webhook/forwardemail
 * Webhook endpoint to receive forwarded emails from forwardemail.net
 *
 * Optional: Set WEBHOOK_SECRET environment variable to enable webhook verification
 * The webhook secret should be sent in the Authorization header or as a query parameter
 *
 * Expected payload format from forwardemail.net:
 * {
 *   from: string,
 *   to: string,
 *   subject?: string,
 *   text?: string,
 *   html?: string,
 *   attachments?: Array<{...}>
 * }
 */
router.post('/forwardemail', async (req, res) => {
  try {
    // Optional webhook secret verification
    const webhookSecret = process.env.WEBHOOK_SECRET;
    if (webhookSecret) {
      const providedSecret =
        req.headers.authorization?.replace('Bearer ', '') ||
        (req.query.secret as string);

      if (providedSecret !== webhookSecret) {
        console.warn('[Webhook] ⚠️ Invalid webhook secret');
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }

    const { from, to, subject, text, html, attachments } = req.body;

    // Validate required fields
    if (!from || !to) {
      console.warn('[Webhook] Missing required fields: from or to');
      return res
        .status(400)
        .json({ error: 'Missing required fields: from and to' });
    }

    console.log(`[Webhook] 📧 Received email from ${from} to ${to}`);

    const domain = process.env.DOMAIN ?? 'mailme.local';
    const username = await saveEmail(from, to, subject, text, html, domain);

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Email received and processed',
      username,
    });
  } catch (err) {
    console.error('[Webhook] ❌ Error processing webhook:', err);
    return res.status(500).json({
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

/**
 * POST /webhook/resend
 * Webhook endpoint to receive forwarded emails from Resend
 *
 * Resend uses Svix for webhook signing. Set RESEND_WEBHOOK_SECRET environment variable
 * to enable webhook signature verification.
 *
 * Expected payload format from Resend:
 * {
 *   type: "email.received",
 *   data: {
 *     email_id: string,
 *     from: string,
 *     to: string[],
 *     subject?: string,
 *     text?: string,
 *     html?: string,
 *     attachments?: Array<{...}>
 *   }
 * }
 */
router.post('/resend', async (req, res) => {
  try {
    // Verify Svix signature if secret is configured
    const resendSecret = process.env.RESEND_WEBHOOK_SECRET;
    if (resendSecret) {
      const signature = req.headers['svix-signature'] as string;
      const timestamp = req.headers['svix-timestamp'] as string;

      if (!signature || !timestamp) {
        console.warn('[Webhook] ⚠️ Missing Svix signature headers');
        return res.status(401).json({ error: 'Missing signature headers' });
      }

      // Svix signature format: v1=signature1 v1=signature2 (space-separated)
      // We need to verify the signature
      const rawBody = JSON.stringify(req.body);
      const signedPayload = `${timestamp}.${rawBody}`;
      const expectedSignature = createHmac('sha256', resendSecret)
        .update(signedPayload)
        .digest('base64');

      // Extract the signature from the header (format: v1=signature, space-separated)
      const signatureParts = signature.split(' ');
      const receivedSignature = signatureParts
        .find(part => part.startsWith('v1='))
        ?.replace('v1=', '');

      if (!receivedSignature || receivedSignature !== expectedSignature) {
        console.warn('[Webhook] ⚠️ Invalid Svix signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const { type, data } = req.body;

    // Only process email.received events
    if (type !== 'email.received') {
      console.log(`[Webhook] Ignoring event type: ${type}`);
      return res
        .status(200)
        .json({ message: 'Event received but not processed' });
    }

    if (!data) {
      console.warn('[Webhook] Missing data in payload');
      return res.status(400).json({ error: 'Missing data in payload' });
    }

    const { from, to, subject, text, html, attachments } = data;

    // Resend sends 'to' as an array, we need to handle the first recipient
    const toAddress = Array.isArray(to) ? to[0] : to;

    if (!from || !toAddress) {
      console.warn('[Webhook] Missing required fields: from or to');
      return res
        .status(400)
        .json({ error: 'Missing required fields: from and to' });
    }

    console.log(`[Webhook] 📧 Received email from ${from} to ${toAddress}`);

    const domain = process.env.DOMAIN ?? 'mailme.local';
    const username = await saveEmail(
      from,
      toAddress,
      subject,
      text,
      html,
      domain
    );

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Email received and processed',
      username,
    });
  } catch (err) {
    console.error('[Webhook] ❌ Error processing Resend webhook:', err);
    return res.status(500).json({
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

export default router;
