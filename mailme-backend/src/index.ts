import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';
import { startCleanupJob } from './cleanup';
import { prisma } from './prisma';

const port = Number(process.env.PORT ?? 4000);

async function start() {
  const app = createApp();

  app.listen(port, () => {
    console.log(`HTTP API listening on ${port}`);
  });

  startCleanupJob();

  // close Prisma on shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down...');
    await prisma.$disconnect();
    process.exit(0);
  });
}

start().catch(err => {
  console.error('Failed to start', err);
  process.exit(1);
});
