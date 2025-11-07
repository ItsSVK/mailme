# MailMe Backend

A lightweight email server backend that receives emails via SMTP and provides a REST API to manage mailboxes and retrieve emails. Built with Bun, Express, Prisma, and SQLite.

## Features

- **SMTP Server**: Receives emails on a configurable port (default: 2525)
- **REST API**: Create mailboxes and retrieve emails via HTTP endpoints
- **Email Storage**: Stores emails in SQLite database with support for text and HTML content
- **Automatic Cleanup**: Periodically deletes emails older than a configured TTL (default: 24 hours)
- **Auto Mailbox Creation**: Automatically creates mailboxes when emails are received for new addresses

## Project Structure

- `src/index.ts` - Main entry point that starts the HTTP server, SMTP server, and cleanup job
- `src/app.ts` - Express application setup
- `src/smtp.ts` - SMTP server implementation for receiving emails
- `src/routes/emails.ts` - REST API endpoints for mailbox and email management
- `src/prisma.ts` - Prisma client initialization
- `src/cleanup.ts` - Background job for deleting old emails
- `prisma/schema.prisma` - Database schema definitions

## API Endpoints

- `POST /mails` - Create a new mailbox

  - Body: `{ "username": "string" }`
  - Returns: Mailbox details including email address

- `GET /mails/:username` - Retrieve emails for a mailbox
  - Query params: `?since=ISODate` (optional) - fetch emails since this date
  - Returns: Array of emails with metadata and content

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
   - `SMTP_PORT` - SMTP server port (default: 2525)
   - `DOMAIN` - Domain for email addresses (default: mailme.local)
   - `EMAIL_TTL_HOURS` - How long to keep emails in hours (default: 24)

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
- SMTP server on port `2525` (or your configured SMTP_PORT)

## Environment Variables

See `.env.example` for all available configuration options:

- `PORT` - HTTP API port
- `SMTP_PORT` - SMTP server port
- `DOMAIN` - Email domain (e.g., mailme.local)
- `DATABASE_URL` - Database connection string (defaults to SQLite)
- `EMAIL_TTL_HOURS` - Email retention time in hours

## Development

This project uses:

- [Bun](https://bun.com) - Fast JavaScript runtime
- [Express](https://expressjs.com) - Web framework
- [Prisma](https://www.prisma.io) - Database ORM
- [smtp-server](https://github.com/nodemailer/smtp-server) - SMTP server implementation
- [mailparser](https://github.com/nodemailer/mailparser) - Email parsing

## Scripts

- `bun dev` - Start development server with watch mode
- `bun run build` - Build the project
- `bun start` - Start production server
- `bun run prisma:generate` - Generate Prisma client
- `bun run prisma:migrate` - Run database migrations
