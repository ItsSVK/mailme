import express from 'express';
import cors from 'cors';
import emailsRoute from './routes/emails';
import webhookRoute from './routes/webhook';

export function createApp() {
  const app = express();

  // Enable CORS for frontend
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    })
  );

  app.use(express.json());

  app.use('/mails', emailsRoute); // POST /mails & GET /mails/:username
  app.use('/webhook', webhookRoute); // POST /webhook/forwardemail

  app.get('/', (_req, res) => res.send('MailMe backend running'));

  return app;
}
