import { Router } from 'express';
import { prisma } from '../prisma';

const router = Router();

/**
 * GET /mails/:username
 * Query params:
 *   ?since=ISODate (optional) - fetch emails since this date
 */
router.get('/:username', async (req, res) => {
  try {
    const username = req.params.username;
    if (!username) return res.status(400).json({ error: 'username required' });

    const mailbox = await prisma.mailbox.findUnique({
      where: { username },
    });
    if (!mailbox) return res.status(404).json({ error: 'mailbox not found' });

    const { since } = req.query;
    const where: any = { mailboxId: mailbox.id };
    if (since && typeof since === 'string') {
      const d = new Date(since);
      if (!isNaN(d.getTime())) where.createdAt = { gt: d };
    }

    const emails = await prisma.email.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return res.json(
      emails.map(e => ({
        id: e.id,
        to: e.to,
        from: e.from,
        subject: e.subject,
        text: e.text,
        html: e.html,
        createdAt: e.createdAt,
      }))
    );
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal' });
  }
});

/**
 * POST /mails
 * body: { username: string }
 */
router.post('/', async (req, res) => {
  try {
    const { username: uname } = req.body;
    if (!uname || typeof uname !== 'string') {
      return res.status(400).json({ error: 'username required' });
    }
    const username = uname.trim();
    if (!/^[a-z0-9](?!.*\.\.)[a-z0-9._-]{1,28}[a-z0-9]$/i.test(username)) {
      return res.status(400).json({ error: 'invalid username' });
    }

    const domain = process.env.DOMAIN ?? 'mailme.local';

    // create or get mailbox
    const mailbox = await prisma.mailbox.upsert({
      where: { username },
      update: {},
      create: { username, domain },
    });

    return res.json({
      username: mailbox.username,
      email: `${mailbox.username}@${mailbox.domain}`,
      createdAt: mailbox.createdAt,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal' });
  }
});

export default router;
