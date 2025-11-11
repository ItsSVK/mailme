export default {
  // Handle HTTP requests (for testing or direct access)
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    console.log('HTTP request received');
    return new Response(
      JSON.stringify({
        message:
          'This Worker handles email routing only. Emails are forwarded to the backend webhook.',
        status: 'ok',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  },

  // Handle incoming emails from Cloudflare Email Routing
  async email(message: EmailMessage, env: Env, ctx: ExecutionContext) {
    try {
      const backendUrl = env.BACKEND_WEBHOOK_URL;
      const secret = env.WEBHOOK_SECRET;

      if (message.to.endsWith('@itssvk.dev')) {
        console.log('[Worker] Bypassing Emails with domain (itssvk.dev)');
        return;
      }

      if (!backendUrl) {
        console.error('[Worker] BACKEND_WEBHOOK_URL not configured');
        return;
      }

      // Validate URL format
      if (
        !backendUrl.startsWith('http://') &&
        !backendUrl.startsWith('https://')
      ) {
        console.error(
          `[Worker] ❌ Invalid BACKEND_WEBHOOK_URL format: ${backendUrl}. Must start with http:// or https://`
        );
        return;
      }

      // Warn if using debug endpoint
      // if (backendUrl.includes('/webhook/debug')) {
      //   console.warn(
      //     '[Worker] ⚠️ WARNING: Using /webhook/debug endpoint. Should use /webhook/cloudflare instead!'
      //   );
      // }

      console.log(
        `[Worker] 📧 Processing email from ${message.from} to ${message.to}`
      );
      console.log(`[Worker] Backend URL: ${backendUrl}`);

      // Read raw RFC822 message as ArrayBuffer
      // Access the raw stream from the EmailMessage
      // @ts-ignore - raw property exists at runtime but may not be in types
      const rawStream = message.raw as ReadableStream<Uint8Array> | undefined;

      if (!rawStream) {
        console.error('[Worker] ❌ EmailMessage.raw is not available');
        return;
      }

      const rawBuffer = await new Response(rawStream).arrayBuffer();

      console.log(`[Worker] Sending to backend: ${backendUrl}`);
      console.log(`[Worker] Body size: ${rawBuffer.byteLength} bytes`);

      // Ensure we're using HTTPS to avoid redirect loops
      const finalUrl = backendUrl.startsWith('http://')
        ? backendUrl.replace('http://', 'https://')
        : backendUrl;

      if (finalUrl !== backendUrl) {
        console.warn(
          `[Worker] ⚠️ Changed URL from ${backendUrl} to ${finalUrl} (forcing HTTPS)`
        );
      }

      // Build headers
      const headers: Record<string, string> = {
        'Content-Type': 'message/rfc822',
        // Helpful context headers (backend will primarily parse the raw)
        'X-Email-To': message.to,
        'X-Email-From': message.from,
      };

      // Add auth if secret is provided
      if (secret) {
        headers['Authorization'] = `Bearer ${secret}`;
      }

      // If bypassing Cloudflare with IP, add Host header
      const bypassIP = env.BYPASS_CLOUDFLARE_IP;
      if (bypassIP && finalUrl.includes(bypassIP)) {
        headers['Host'] = 'mailmeapi.itssvk.dev';
        headers['X-Forwarded-Proto'] = 'https';
      }

      const res = await fetch(finalUrl, {
        method: 'POST',
        headers,
        body: rawBuffer,
        // Don't follow redirects automatically - handle manually to avoid loops
        redirect: 'manual',
      });

      console.log(`[Worker] Response status: ${res.status}`);
      console.log(
        `[Worker] Response headers:`,
        Object.fromEntries(res.headers.entries())
      );

      // Handle redirects manually
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location');
        console.error(
          `[Worker] ❌ Redirect detected (${res.status}) to: ${location}`
        );
        console.error(
          '[Worker] ⚠️ Backend is redirecting. This might cause issues. Check nginx/backend configuration.'
        );
        // Try following the redirect once manually
        if (location && location.startsWith('http')) {
          console.log(`[Worker] Attempting to follow redirect to: ${location}`);
          const redirectRes = await fetch(location, {
            method: 'POST',
            headers: {
              'Content-Type': 'message/rfc822',
              ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
              'X-Email-To': message.to,
              'X-Email-From': message.from,
            },
            body: rawBuffer,
            redirect: 'manual',
          });

          if (redirectRes.status >= 300 && redirectRes.status < 400) {
            console.error(
              '[Worker] ❌ Redirect loop detected! Multiple redirects.'
            );
            return;
          }

          // Use the redirect response
          const finalStatus = redirectRes.status;
          const finalOk = redirectRes.ok;

          if (!finalOk) {
            const errorText = await redirectRes.text();
            console.error(
              `[Worker] ❌ Backend webhook failed after redirect: ${finalStatus} - ${errorText}`
            );
          } else {
            console.log(
              '[Worker] ✅ Email forwarded to backend successfully (after redirect)'
            );
          }
          return;
        }
        return;
      }

      if (!res.ok) {
        const errorText = await res.text();
        console.error(
          `[Worker] ❌ Backend webhook failed: ${res.status} - ${errorText}`
        );
      } else {
        console.log('[Worker] ✅ Email forwarded to backend successfully');
      }
    } catch (err) {
      console.error('[Worker] ❌ Error forwarding email:', err);
      // Let the message continue; you can also choose to reject if desired
    }
  },
} satisfies ExportedHandler<Env>;

interface Env {
  BACKEND_WEBHOOK_URL: string;
  WEBHOOK_SECRET: string;
  BYPASS_CLOUDFLARE_IP?: string; // Optional: origin server IP to bypass Cloudflare proxy
}
