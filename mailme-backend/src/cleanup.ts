import { prisma } from './prisma';

export function startCleanupJob() {
  const ttlHours = Number(process.env.EMAIL_TTL_HOURS ?? 24);
  const intervalMs = 60 * 60 * 1000; // run hourly

  const job = setInterval(async () => {
    const cutoff = new Date(Date.now() - ttlHours * 3600 * 1000);
    try {
      // Delete old emails
      const deleted = await prisma.email.deleteMany({
        where: { createdAt: { lt: cutoff } },
      });
      if (deleted.count)
        console.log(
          `Cleanup: deleted ${
            deleted.count
          } emails older than ${cutoff.toISOString()}`
        );

      // Delete mailboxes with no emails
      // Find all mailboxes and check which ones have no emails
      const allMailboxes = await prisma.mailbox.findMany({
        select: {
          id: true,
          _count: {
            select: { emails: true },
          },
        },
      });

      // Find mailboxes without any emails
      const emptyMailboxIds = allMailboxes
        .filter(mb => mb._count.emails === 0)
        .map(mb => mb.id);

      if (emptyMailboxIds.length > 0) {
        const deletedMailboxes = await prisma.mailbox.deleteMany({
          where: { id: { in: emptyMailboxIds } },
        });
        if (deletedMailboxes.count)
          console.log(
            `Cleanup: deleted ${deletedMailboxes.count} empty mailbox(es)`
          );
      }
    } catch (e) {
      console.error('cleanup error', e);
    }
  }, intervalMs);

  return () => clearInterval(job);
}
