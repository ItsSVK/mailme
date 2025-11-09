import { Router } from 'express';
import { prisma } from '../prisma';

const router = Router();

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

    // Extract username from the "to" email address
    // Format: username@domain
    const domain = process.env.DOMAIN ?? 'mailme.local';
    const toAddress = typeof to === 'string' ? to : '';

    // Check if the email is for our domain
    if (!toAddress.endsWith(`@${domain}`)) {
      console.warn(
        `[Webhook] ⚠️ Email not for our domain: ${toAddress} (expected @${domain})`
      );
      return res.status(400).json({ error: `Email not for domain ${domain}` });
    }

    const username = toAddress.split('@')[0]?.trim();

    if (!username) {
      console.warn(
        '[Webhook] ⚠️ Could not extract username from email address'
      );
      return res
        .status(400)
        .json({ error: 'Could not extract username from email address' });
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
      `[Webhook] ✅ Saved email for ${username}: ${
        subjectText ?? '<no-subject>'
      }`
    );

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

export default router;
