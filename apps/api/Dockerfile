# Build stage
FROM node:20-alpine AS builder

# Required for Prisma on Alpine Linux
RUN apk add --no-cache openssl openssl-dev libc6-compat

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy workspace packages
COPY apps/api ./apps/api
COPY packages ./packages

# Install all dependencies (root + workspaces)
RUN npm install

# Install api dependencies explicitly (in case workspace hoisting misses them)
WORKDIR /app/apps/api
RUN npm install --legacy-peer-deps

# Build shared packages first
WORKDIR /app
WORKDIR /app/packages/mh-client
RUN npm run build || echo "mh-client build skipped"

WORKDIR /app/packages/shared
RUN npm run build || echo "shared build skipped"

# Generate Prisma client
WORKDIR /app/apps/api
RUN npx prisma generate

# Build NestJS application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

# Required for Prisma on Alpine Linux
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy built application
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./node_modules_api
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/package.json ./

# Merge api node_modules into main node_modules (for dependencies not hoisted)
RUN cp -rn ./node_modules_api/* ./node_modules/ 2>/dev/null || true && rm -rf ./node_modules_api

# Copy Prisma schema (needed for migrations in production)
COPY --from=builder /app/apps/api/prisma ./prisma

EXPOSE 3001
ENV PORT=3001
ENV NODE_ENV=production

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "dist/main.js"]
