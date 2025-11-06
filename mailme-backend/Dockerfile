# syntax=docker/dockerfile:1

FROM oven/bun:1 as base
WORKDIR /app

# Install dependencies separately for better caching
COPY package.json bun.lock ./
RUN bun install --production --frozen-lockfile

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN bunx prisma generate

# Copy source and build
COPY src ./src
RUN bun run build

# Runtime image
FROM oven/bun:1
WORKDIR /app
ENV NODE_ENV=production

# Copy node_modules (bun) and build output and prisma schema
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/bun.lock ./bun.lock
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/dist ./dist

EXPOSE 4000 2525

# Run pending migrations and start the server
CMD ["sh", "-c", "bunx prisma migrate deploy && bun dist/index.js"]


