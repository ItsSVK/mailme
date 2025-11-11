import express, { Router } from 'express';
import { prisma } from '../prisma';
import { simpleParser } from 'mailparser';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

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

/**
 * POST /webhook/debug
 * Debug endpoint to capture and save complete request as a curl command
 * Useful for testing webhook payloads via Postman - saves curl command you can copy/paste
 *
 * Saves requests to: ./webhook-debug/ directory with timestamped filenames
 * - .json file: Full request data in JSON format
 * - .sh file: Executable curl command
 */
router.post(
  '/debug',
  // Accept any content type and capture raw body
  express.raw({ type: '*/*', limit: '50mb' }),
  async (req, res) => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const jsonFilename = `webhook-request-${timestamp}.json`;
      const curlFilename = `webhook-request-${timestamp}.sh`;

      // Create debug directory if it doesn't exist
      const debugDir = join(process.cwd(), 'webhook-debug');
      try {
        await mkdir(debugDir, { recursive: true });
      } catch (err) {
        // Directory might already exist, ignore error
      }

      // Capture all headers
      const headers: Record<string, string | string[] | undefined> = {};
      Object.keys(req.headers).forEach(key => {
        headers[key] = req.headers[key];
      });

      // Get the full URL
      const protocol = req.protocol || 'http';
      const host = req.get('host') || 'localhost:4000';
      const baseUrl = `${protocol}://${host}`;

      // Build URL with query parameters
      let url = `${baseUrl}${req.path}`;
      const queryParams = new URLSearchParams();
      Object.keys(req.query).forEach(key => {
        const value = req.query[key];
        if (value) {
          queryParams.append(key, String(value));
        }
      });
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }

      // Try to parse body as JSON if possible, otherwise keep as base64
      let body: any;
      let rawBodyBase64: string | undefined;
      let bodyString: string | undefined;

      if (req.body instanceof Buffer) {
        rawBodyBase64 = req.body.toString('base64');
        bodyString = req.body.toString('utf-8');

        // Try to parse as JSON
        try {
          body = JSON.parse(bodyString);
        } catch {
          // Not JSON, keep as text
          body = bodyString;
        }
      } else {
        body = req.body;
        bodyString =
          typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      }

      // Capture query parameters
      const query = req.query;

      // Create request object to save
      const requestData = {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        path: req.path,
        query,
        headers,
        body,
        rawBodyBase64: rawBodyBase64 || undefined,
        bodySize: req.body instanceof Buffer ? req.body.length : undefined,
        contentType: req.headers['content-type'] || 'unknown',
      };

      // Generate curl command
      const curlParts: string[] = [];
      curlParts.push(`curl --location '${url}'`);
      curlParts.push(`--request ${req.method.toUpperCase()}`);

      // Add all headers (skip host as it's in the URL)
      Object.keys(req.headers).forEach(key => {
        if (
          key.toLowerCase() === 'host' ||
          key.toLowerCase() === 'content-length'
        ) {
          return; // Skip host and content-length
        }
        const value = req.headers[key];
        if (value) {
          const headerValue = Array.isArray(value) ? value[0] : value;
          if (headerValue) {
            // Escape single quotes in header values
            const escapedValue = headerValue.replace(/'/g, "'\\''");
            curlParts.push(`--header '${key}: ${escapedValue}'`);
          }
        }
      });

      // Add body
      if (bodyString && bodyString.length > 0) {
        // Check if it's JSON
        const isJson =
          req.headers['content-type']?.includes('application/json');
        if (isJson) {
          // For JSON, format as single line for curl (Postman compatible)
          try {
            const parsed = JSON.parse(bodyString);
            const jsonString = JSON.stringify(parsed);
            // Escape single quotes for shell: ' becomes '\''
            const escaped = jsonString.replace(/'/g, "'\\''");
            curlParts.push(`--data-raw '${escaped}'`);
          } catch {
            // Not valid JSON, use as-is
            const escaped = bodyString.replace(/'/g, "'\\''");
            curlParts.push(`--data-raw '${escaped}'`);
          }
        } else {
          // For non-JSON, escape properly
          const escaped = bodyString.replace(/'/g, "'\\''");
          curlParts.push(`--data-raw '${escaped}'`);
        }
      }

      const curlCommand = curlParts.join(' \\\n');

      // Save JSON file
      const jsonFilePath = join(debugDir, jsonFilename);
      await writeFile(
        jsonFilePath,
        JSON.stringify(requestData, null, 2),
        'utf-8'
      );

      // Save curl command file
      const curlFilePath = join(debugDir, curlFilename);
      await writeFile(curlFilePath, `#!/bin/bash\n${curlCommand}\n`, 'utf-8');

      console.log(`[Webhook] 💾 Saved debug request:`);
      console.log(`  JSON: ${jsonFilePath}`);
      console.log(`  CURL: ${curlFilePath}`);

      // return res.status(200).json({
      //   success: true,
      //   message: 'Request saved successfully',
      //   files: {
      //     json: jsonFilename,
      //     curl: curlFilename,
      //   },
      //   paths: {
      //     json: jsonFilePath,
      //     curl: curlFilePath,
      //   },
      //   curlCommand,
      //   timestamp: requestData.timestamp,
      // });

      return res.status(200).json({});
    } catch (err) {
      console.error('[Webhook] ❌ Error saving debug request:', err);
      return res.status(500).json({
        error: 'Internal server error',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }
);

export default router;
