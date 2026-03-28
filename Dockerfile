FROM node:20-alpine AS base

# Install build tools needed for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
ENV NODE_ENV=production
ENV DB_PATH=/data/orders.db

WORKDIR /app

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/menu.json ./menu.json

EXPOSE 3000

CMD ["node", "server.js"]
