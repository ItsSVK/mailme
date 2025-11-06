import { SMTPServer } from 'smtp-server';
import { simpleParser } from 'mailparser';
import { prisma } from './prisma';

export function startSmtpServer() {
  const port = parseInt(process.env.SMTP_PORT || '2525', 10);
  const domain = process.env.DOMAIN ?? 'mailme.local';

  console.log(
    `[SMTP] Starting SMTP server on port ${port} for domain ${domain}`
  );

  const server = new SMTPServer({
    disabledCommands: ['AUTH'],
    authOptional: true,
    onConnect(session, callback) {
      console.log(`[SMTP] Client connected from ${session.remoteAddress}`);
      callback(); // accept connection
    },
    onMailFrom(address, session, callback) {
      const from = address.address ?? 'unknown';
      console.log(`[SMTP] MAIL FROM: ${from}`);
      callback(); // accept
    },
    onRcptTo(address, session, callback) {
      const addr = address.address ?? '';
      console.log(`[SMTP] RCPT TO: ${addr}`);
      console.log(`[SMTP] Checking if ${addr} ends with @${domain}`);

      if (!addr.endsWith(`@${domain}`)) {
        console.log(
          `[SMTP] ❌ Rejected: ${addr} does not match domain @${domain}`
        );
        return callback(new Error('Mailbox not on this domain'));
      }

      console.log(`[SMTP] ✅ Accepted recipient: ${addr}`);
      callback(); // accept
    },
    onData(stream, session, callback) {
      console.log('[SMTP] 📧 Received email data, parsing...');
      simpleParser(stream)
        .then(async parsed => {
          try {
            console.log('[SMTP] ✅ Email parsed successfully');
            // Handle parsed.to which can be AddressObject or AddressObject[]
            const toValue = Array.isArray(parsed.to) ? parsed.to[0] : parsed.to;
            const toAddress = toValue?.value?.[0]?.address ?? '';
            const username = toAddress.split('@')[0] || 'unknown';

            if (!username || username === 'unknown') {
              console.warn(
                '[SMTP] ⚠️ Could not extract username from email address'
              );
              return;
            }

            console.log(`[SMTP] Processing email for username: ${username}`);

            // find mailbox (if we only accept mail for created mailboxes)
            const mailbox = await prisma.mailbox.findUnique({
              where: { username },
            });

            // If you want to accept all addresses without prior create, create mailbox on the fly:
            if (!mailbox) {
              console.log(
                `[SMTP] Mailbox ${username} not found — creating on-the-fly`
              );
              await prisma.mailbox.create({
                data: {
                  username,
                  domain: domain,
                },
              });
            }

            const mailboxFinal = await prisma.mailbox.findUnique({
              where: { username },
            });

            if (!mailboxFinal) {
              console.warn(
                `[SMTP] ⚠️ Could not create/find mailbox ${username}`
              );
              return;
            }

            // Handle parsed.from which can be AddressObject or AddressObject[]
            const fromValue = Array.isArray(parsed.from)
              ? parsed.from[0]
              : parsed.from;
            const fromText =
              fromValue?.text ?? fromValue?.value?.[0]?.address ?? 'unknown';

            // Handle parsed.to text
            const toText = toValue?.text ?? toAddress;

            await prisma.email.create({
              data: {
                mailboxId: mailboxFinal.id,
                to: toText,
                from: fromText,
                subject: parsed.subject ?? null,
                text: parsed.text ?? null,
                html:
                  parsed.html && typeof parsed.html === 'string'
                    ? parsed.html
                    : null,
                raw: parsed.textAsHtml ?? parsed.text ?? '',
              },
            });

            console.log(
              `[SMTP] ✅ Saved email for ${username}: ${
                parsed.subject ?? '<no-subject>'
              }`
            );
          } catch (e) {
            console.error('[SMTP] ❌ Error saving parsed email', e);
          }
        })
        .catch(err => console.error('[SMTP] ❌ mailparser error', err))
        .finally(() => callback(null));
    },
  });

  server.on('error', err => {
    console.error('[SMTP] ❌ Server error:', err);
  });

  server.listen(port, () => {
    console.log(`[SMTP] ✅ SMTP server listening on port ${port}`);
    console.log(`[SMTP] 📧 Accepting emails for domain: ${domain}`);
  });

  return server;
}
