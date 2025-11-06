import express from 'express';
import bodyParser from 'body-parser';
import emailsRoute from './routes/emails';

export function createApp() {
  const app = express();
  app.use(bodyParser.json());

  app.use('/api/mails', emailsRoute); // POST /api/mails & GET /api/mails/:username

  app.get('/', (_req, res) => res.send('MailMe backend running'));

  return app;
}
