import { prisma } from './prisma';

export function startCleanupJob() {
  const ttlHours = Number(process.env.EMAIL_TTL_HOURS ?? 24);
  const intervalMs = 60 * 60 * 1000; // run hourly

  const job = setInterval(async () => {
    const cutoff = new Date(Date.now() - ttlHours * 3600 * 1000);
    try {
      const deleted = await prisma.email.deleteMany({
        where: { createdAt: { lt: cutoff } },
      });
      if (deleted.count)
        console.log(
          `Cleanup: deleted ${
            deleted.count
          } emails older than ${cutoff.toISOString()}`
        );
    } catch (e) {
      console.error('cleanup error', e);
    }
  }, intervalMs);

  return () => clearInterval(job);
}
