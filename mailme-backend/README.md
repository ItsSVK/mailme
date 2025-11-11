# MailMe Backend

A lightweight email server backend that receives emails via Cloudflare Email Routing and provides a REST API to manage mailboxes and retrieve emails. Built with Bun, Express, Prisma, and SQLite.

## Features

- **Cloudflare Email Routing**: Receives emails via Cloudflare Worker webhook integration
- **REST API**: Create mailboxes and retrieve emails via HTTP endpoints
- **Email Storage**: Stores emails in SQLite database with support for text and HTML content
- **Automatic Cleanup**: Periodically deletes emails older than a configured TTL (default: 24 hours)
- **Webhook Integration**: Secure webhook endpoints for receiving emails from Cloudflare Workers

## Project Structure

- `src/index.ts` - Main entry point that starts the HTTP server and cleanup job
- `src/app.ts` - Express application setup
- `src/routes/emails.ts` - REST API endpoints for mailbox and email management
- `src/routes/webhook.ts` - Webhook endpoints for receiving emails from Cloudflare Workers
- `src/prisma.ts` - Prisma client initialization
- `src/cleanup.ts` - Background job for deleting old emails
- `prisma/schema.prisma` - Database schema definitions
- `cloudflare/worker.ts` - Cloudflare Worker for email routing
- `cloudflare/wrangler.toml` - Cloudflare Worker configuration

## API Endpoints

### Mailbox Management

- `POST /mails` - Create a new mailbox

  - Body: `{ "username": "string" }`
  - Returns: Mailbox details including email address

- `GET /mails/:username` - Retrieve emails for a mailbox
  - Query params: `?since=ISODate` (optional) - fetch emails since this date
  - Returns: Array of emails with metadata and content

### Webhook Endpoints

- `POST /webhook/cloudflare` - Receive emails from Cloudflare Worker

  - Content-Type: `message/rfc822`
  - Authorization: `Bearer <WEBHOOK_SECRET>` (optional, if configured)
  - Body: Raw RFC822 email message

- `POST /webhook/debug` - Debug endpoint for testing webhook payloads
  - Saves request data to `./webhook-debug/` directory
  - Useful for testing and debugging email webhooks

## Setup Instructions

1. **Install dependencies:**

   ```bash
   bun install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure:

   - `PORT` - HTTP API port (default: 4000)
   - `DOMAIN` - Domain for email addresses (default: mailme.local)
   - `EMAIL_TTL_HOURS` - How long to keep emails in hours (default: 24)
   - `WEBHOOK_SECRET` - Optional secret for webhook authentication
   - `FRONTEND_URL` - Frontend URL for CORS configuration

3. **Generate Prisma client:**

   ```bash
   bun run prisma:generate
   ```

   or

   ```bash
   bunx prisma generate
   ```

4. **Run database migrations:**

   ```bash
   bun run prisma:migrate
   ```

   or

   ```bash
   bunx prisma migrate dev
   ```

5. **Start the development server:**
   ```bash
   bun dev
   ```

The server will start:

- HTTP API on `http://localhost:4000` (or your configured PORT)

6. **Deploy Cloudflare Worker (optional):**

   ```bash
   # Login to Cloudflare
   bun run wl

   # Set environment variables as secrets (required before deployment)
   cd cloudflare
   wrangler secret put BACKEND_WEBHOOK_URL
   # Enter your backend webhook URL when prompted (e.g., https://yourdomain.com/webhook/cloudflare)

   wrangler secret put WEBHOOK_SECRET
   # Enter your webhook secret when prompted (must match backend WEBHOOK_SECRET)
   cd ..

   # Deploy the worker
   bun run wd

   # Tail worker logs
   bun run wt
   ```

   **Note:** Environment variables must be set using `wrangler secret put` command (as shown above) or via the Cloudflare Dashboard:

   - Workers & Pages > mailme-email-worker > Settings > Variables

   Required variables:

   - `BACKEND_WEBHOOK_URL` - Your backend webhook URL (e.g., `https://yourdomain.com/webhook/cloudflare`)
   - `WEBHOOK_SECRET` - Optional secret for authentication (must match backend `WEBHOOK_SECRET`)

## Environment Variables

See `.env.example` for all available configuration options:

- `PORT` - HTTP API port (default: 4000)
- `DOMAIN` - Email domain (e.g., mailme.local)
- `DATABASE_URL` - Database connection string (defaults to SQLite)
- `EMAIL_TTL_HOURS` - Email retention time in hours (default: 24)
- `WEBHOOK_SECRET` - Optional secret for webhook authentication
- `FRONTEND_URL` - Frontend URL for CORS configuration

## Development

This project uses:

- [Bun](https://bun.com) - Fast JavaScript runtime
- [Express](https://expressjs.com) - Web framework
- [Prisma](https://www.prisma.io) - Database ORM
- [mailparser](https://github.com/nodemailer/mailparser) - Email parsing
- [Cloudflare Workers](https://workers.cloudflare.com) - Email routing via Cloudflare Email Routing
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/) - Cloudflare Workers CLI

## Scripts

### Backend Scripts

- `bun dev` - Start development server with watch mode
- `bun run build` - Build the project
- `bun start` - Start production server
- `bun run prisma:generate` - Generate Prisma client
- `bun run prisma:migrate` - Run database migrations

### Cloudflare Worker Scripts

- `bun run wl` - Login to Cloudflare (wrangler login)
- `bun run wd` - Deploy Cloudflare Worker (wrangler deploy)
- `bun run wt` - Tail Cloudflare Worker logs (wrangler tail)
