import PostalMime from 'postal-mime';

export interface Env {
  DB: D1Database;
  EMAILS_KV: KVNamespace;
  DOMAIN: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // POST /api/mails - Create or get mailbox
      if (path === '/api/mails' && method === 'POST') {
        const { username } = await request.json() as { username: string };
        if (!username) return new Response('Username required', { status: 400, headers: corsHeaders });

        const id = crypto.randomUUID();
        const domain = env.DOMAIN || 'mailme.itssvk.dev';

        // Try to insert, if exists just return existing
        await env.DB.prepare(
          'INSERT OR IGNORE INTO mailboxes (id, username, domain) VALUES (?, ?, ?)'
        ).bind(id, username, domain).run();

        const mailbox = await env.DB.prepare(
          'SELECT * FROM mailboxes WHERE username = ?'
        ).bind(username).first<{ id: string, username: string, domain: string, created_at: string }>();

        return new Response(JSON.stringify({
          username: mailbox?.username,
          email: `${mailbox?.username}@${mailbox?.domain}`,
          createdAt: mailbox?.created_at
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // GET /api/mails/:username - List emails
      if (path.startsWith('/api/mails/') && method === 'GET') {
        const parts = path.split('/');
        const username = parts[3];
        
        if (parts.length === 4) {
          const mailbox = await env.DB.prepare(
            'SELECT id FROM mailboxes WHERE username = ?'
          ).bind(username).first<{ id: string }>();

          if (!mailbox) return new Response('Mailbox not found', { status: 404, headers: corsHeaders });

          const emails = await env.DB.prepare(
    'SELECT id, "to", "from", subject, snippet, created_at as createdAt FROM emails WHERE mailbox_id = ? ORDER BY created_at DESC'
).bind(mailbox.id).all();

          return new Response(JSON.stringify(emails.results), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // GET /api/mails/:username/:emailId - Get full email
        if (parts.length === 5) {
          const emailId = parts[4];
          const emailMetadata = await env.DB.prepare(
            'SELECT * FROM emails WHERE id = ?'
          ).bind(emailId).first<{ id: string, subject: string, to: string, from: string, created_at: string }>();

          if (!emailMetadata) return new Response('Email not found', { status: 404, headers: corsHeaders });

          const content = await env.EMAILS_KV.get<{ text: string, html: string }>(emailId, 'json');

          return new Response(JSON.stringify({
            ...emailMetadata,
            createdAt: emailMetadata.created_at,
            text: content?.text || '',
            html: content?.html || ''
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  },

  async email(message: any, env: Env, ctx: ExecutionContext): Promise<void> {
    const domain = env.DOMAIN || 'mailme.itssvk.dev';
    
    // Check if the email is for our domain
    if (!message.to.endsWith(`@${domain}`)) {
      console.log(`[Worker] Rejecting email for external domain: ${message.to}`);
      return;
    }

    const username = message.to.split('@')[0];
    const mailbox = await env.DB.prepare(
      'SELECT id FROM mailboxes WHERE username = ?'
    ).bind(username).first<{ id: string }>();

    if (!mailbox) {
      console.log(`[Worker] Mailbox not found for: ${username}`);
      return;
    }

    try {
      const rawStream = message.raw;
      const rawBuffer = await new Response(rawStream).arrayBuffer();
      
      const parser = new PostalMime();
      const parsed = await parser.parse(rawBuffer);

      const emailId = crypto.randomUUID();
      const subject = parsed.subject || '(No Subject)';
      
      // Handle potentially multiple 'from' addresses
      let fromAddress = message.from;
      if (parsed.from) {
        if (Array.isArray(parsed.from)) {
          fromAddress = (parsed.from[0] as any)?.address || fromAddress;
        } else {
          fromAddress = (parsed.from as any).address || fromAddress;
        }
      }

      const text = parsed.text || '';
      const html = parsed.html || '';

      const snippet = text.substring(0, 100) || html.replace(/<[^>]*>/g, '').substring(0, 100);

      // Store metadata in D1
      await env.DB.prepare(
        'INSERT INTO emails (id, mailbox_id, "to", "from", subject, snippet) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(emailId, mailbox.id, message.to, fromAddress, subject, snippet).run();

      // Store content in KV with 24 hour TTL (86400 seconds)
      await env.EMAILS_KV.put(emailId, JSON.stringify({ text, html }), {
        expirationTtl: 86400
      });

      console.log(`[Worker] Saved email from ${fromAddress} to ${username}`);
    } catch (err) {
      console.error('[Worker] Error processing email:', err);
    }
  }
};
