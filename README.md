# MailMe

A modern, privacy-focused temporary email service that allows users to create instant disposable email addresses. Built with React, Express, Bun, and Cloudflare Email Routing.

## Features

- 🚀 **Instant Setup** - Create temporary email addresses instantly, no registration required
- 🔒 **Privacy First** - Protect your real email from spam and unwanted messages
- ⚡ **Real-time Updates** - Auto-refreshing mailbox with 15-second polling
- 🎨 **Modern UI** - Beautiful, responsive interface with dark mode support
- 🧹 **Auto Cleanup** - Emails and empty mailboxes automatically deleted after 24 hours
- 📧 **Cloudflare Integration** - Leverages Cloudflare Email Routing for reliable email delivery
- 🐳 **Docker Support** - Easy deployment with Docker Compose

## Tech Stack

**Frontend:** React 19, TypeScript, Vite, TanStack Query, Tailwind CSS, Radix UI  
**Backend:** Bun, Express, Prisma (SQLite), Cloudflare Workers

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) installed
- Docker and Docker Compose (for containerized deployment)

### Development Setup

1. **Clone and install dependencies**

   ```bash
   git clone <repository-url>
   cd mailme
   cd mailme-backend && bun install && bun run prisma:generate && bun run prisma:migrate
   cd ../mailme-frontend && bun install
   ```

2. **Configure environment variables**

   Create `.env` files in both directories (see example values in the individual README files).

3. **Start development servers**

   ```bash
   # Terminal 1
   cd mailme-backend && bun dev

   # Terminal 2
   cd mailme-frontend && bun dev
   ```

   Access at http://localhost:5173

### Docker Deployment

```bash
docker-compose up -d
```

Access at http://localhost:8080

## Project Structure

```
mailme/
├── mailme-backend/          # Backend API server
│   ├── src/
│   │   ├── app.ts          # Express app setup
│   │   ├── index.ts        # Server entry point
│   │   ├── routes/         # API routes
│   │   ├── cleanup.ts      # Background cleanup job
│   │   └── prisma.ts       # Prisma client
│   ├── cloudflare/         # Cloudflare Worker
│   ├── prisma/             # Database schema & migrations
│   └── README.md           # Backend-specific docs
│
├── mailme-frontend/         # React frontend
│   ├── src/
│   │   ├── pages/          # Page components
│   │   ├── components/     # Reusable components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities & API client
│   └── README.md           # Frontend-specific docs
│
└── docker-compose.yml       # Docker orchestration
```

For detailed setup, API documentation, and deployment instructions, see the README files in `mailme-backend/` and `mailme-frontend/`.

## License

This project is open source and available for personal use.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
