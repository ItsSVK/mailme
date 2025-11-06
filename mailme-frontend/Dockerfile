# syntax=docker/dockerfile:1

FROM oven/bun:1 as build
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# Build-time API base URL for Vite
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN bun run build

FROM nginx:alpine
WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist .

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]


