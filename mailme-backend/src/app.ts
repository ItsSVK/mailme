import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import emailsRoute from './routes/emails';

export function createApp() {
  const app = express();

  // Enable CORS for frontend
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    })
  );

  app.use(bodyParser.json());

  app.use('/api/mails', emailsRoute); // POST /api/mails & GET /api/mails/:username

  app.get('/', (_req, res) => res.send('MailMe backend running'));

  return app;
}
