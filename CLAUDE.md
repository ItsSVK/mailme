# MailMe — Project Context

Disposable email service. Users pick a username, get `username@mailme.itssvk.dev`, receive emails for 24 hours, then everything auto-deletes.

## Monorepo Structure

```
mailme/
├── mailme-frontend/          # React + Vite — deployed on Vercel
├── mailme-backend-worker/    # Cloudflare Worker — ACTIVE backend
└── mailme-backend/           # Node.js/Bun + Prisma — NOT IN USE, ignore
```

`mailme-backend` is dead code. Never touch it. All backend work goes in `mailme-backend-worker`.

## Active Services

### Frontend (`mailme-frontend/`)
- **Stack:** React 19, Vite 6, TypeScript, Tailwind CSS v4, shadcn/ui (Radix), TanStack Query v5, React Router v7, Sonner toasts, Vercel Analytics
- **Deploy:** Vercel (auto on push to main)
- **Domain:** `https://mailme.itssvk.dev`
- **API target:** `VITE_API_URL` env var → defaults to `https://mailme-email-worker.connectshouvik.workers.dev/api`

### Backend (`mailme-backend-worker/`)
- **Stack:** Cloudflare Worker (TypeScript), `postal-mime` for email parsing
- **Deploy:** `wrangler deploy` from `mailme-backend-worker/`
- **Worker name:** `mailme-email-worker`
- **Domain:** `mailme.itssvk.dev` (Cloudflare Email Routing sends inbound to this worker)

## Data Storage

Split storage model — two CF primitives:

| Store | What | TTL |
|---|---|---|
| **D1 (SQLite)** `mailme-db` | `mailboxes` + `emails` tables (metadata: to/from/subject/snippet) | cleaned by hourly cron |
| **KV** `EMAILS_KV` | Full email body `{ text, html }` keyed by `emailId` | 24hr hard TTL |

**Critical:** KV expires at 24hr. D1 cleanup runs hourly (deletes emails older than 24hr, mailboxes older than 7 days with no emails). Gap window exists where KV is gone but D1 row still exists — worker returns **410 Gone** in this case, handled gracefully in frontend.

### DB Schema (`schema.sql`)
```sql
mailboxes: id (UUID PK), username (UNIQUE), domain, created_at
emails:    id (UUID PK), mailbox_id (FK), to, from, subject, snippet, created_at
-- Full body stored in KV, not D1
```

## API Endpoints

All under `/api/` on the worker:

| Method | Path | What |
|---|---|---|
| `POST` | `/api/mails` | Create or get mailbox by username |
| `GET` | `/api/mails/:username` | List emails (metadata only) |
| `GET` | `/api/mails/:username/:emailId` | Full email (fetches body from KV) |

Worker also handles:
- **`email` handler** — inbound email via CF Email Routing → parse → D1 metadata + KV body
- **`scheduled` handler** — hourly cron (`0 * * * *`) → cleanup old emails + dead mailboxes

## Username Rules

Regex (enforced on **both** frontend and backend):
```
/^[a-z0-9](?!.*\.\.)[a-z0-9._-]{1,28}[a-z0-9]$/
```
Lowercase alphanumeric, dots/underscores/hyphens allowed in middle, 3–30 chars total, no consecutive dots.

## Security / Abuse Protection

- **Rate limiting:** `rl:{ip}` counter in KV, max 20 mailbox creations/IP/hour (1hr expiry)
- **Username validation:** server-side regex on every POST
- **CORS:** `Access-Control-Allow-Origin: *` (public API by design)
- **No auth** — inboxes are public; anyone who knows the username can read it (by design, disclosed in FAQ)

## Key Frontend Files

```
src/
├── lib/api.ts              # All fetch calls (createMailbox, fetchEmails, fetchEmailDetails)
├── hooks/useMailbox.ts     # TanStack Query wrappers (useCreateMailbox, useEmails, useEmailDetails)
├── pages/
│   ├── Home.tsx            # Username form + random username generator
│   └── Mailbox.tsx         # Inbox view, polls every 15s, copy email button
└── components/
    ├── EmailView.tsx       # Renders email; iframe for HTML, plain text fallback; OTP extraction
    └── EmailList.tsx       # Email list sidebar
```

## Notable Implementation Details

- **Email rendering:** HTML emails rendered in sandboxed `<iframe srcDoc>` with `sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"`. Links forced to `target="_blank"` via injected `<base>` tag. Iframe height auto-sized from `scrollHeight` on load.
- **OTP extraction:** `EmailView` auto-detects 4–8 digit OTPs from email body (labeled match first, bare number fallback), shows a one-click copy banner.
- **Polling:** Mailbox page refetches every 15s (`refetchInterval: 15000`) + `refetchOnWindowFocus: true`.
- **Email body cache:** TanStack Query keeps email detail in cache for 5 minutes (`staleTime: 1000 * 60 * 5`), no refetch on window focus.
- **Random username:** `adjective + noun + 4-digit number` generator on Home page (Shuffle button).
- **Username stored in `sessionStorage`** — not in URL, so it doesn't leak in browser history or server logs.
- **Neumorphism design system** — custom CSS classes `neu-sm`, `neu-md`, `neu-lg`, `neu-inset`, `shadow-brand` defined in `src/index.css`.

## Dev Commands

```bash
# Frontend
cd mailme-frontend
bun install
bun run dev          # http://localhost:5173

# Worker
cd mailme-backend-worker
npm install
npm run dev          # wrangler dev (local worker)
npm run deploy       # wrangler deploy (to Cloudflare)
```

## Environment Variables

**Frontend (`.env`):**
```
VITE_DOMAIN=mailme.itssvk.dev
VITE_API_URL=https://mailme-email-worker.connectshouvik.workers.dev/api
```

**Worker (`wrangler.toml` vars):**
```
DOMAIN = "mailme.itssvk.dev"
```
D1 database ID and KV namespace ID are in `wrangler.toml` — do not regenerate without migrating data.

## Deployment Notes

- Frontend: push to `main` → Vercel auto-deploys
- Worker: manual `wrangler deploy` from `mailme-backend-worker/`
- D1 schema changes: run `wrangler d1 execute mailme-db --file=schema.sql` (schema uses `CREATE TABLE IF NOT EXISTS` so safe to re-run)
- Cron runs at `0 * * * *` (every hour on the hour)
