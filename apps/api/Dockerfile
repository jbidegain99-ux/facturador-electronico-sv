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

# DEBUG: Show what was copied
RUN echo "=== DEBUG: Content of email.types.ts ===" && \
    cat apps/api/src/modules/email-config/types/email.types.ts | grep -n "smtpUser\|refreshToken\|oauth2" | head -20

# Install all dependencies (root + workspaces)
RUN npm install

# Install api dependencies explicitly to ensure they're in node_modules
WORKDIR /app/apps/api
RUN npm install --legacy-peer-deps

# Build shared packages first
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
COPY --from=builder /app/apps/api/node_modules ./api_node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/package.json ./

# Merge api node_modules into main (for deps not hoisted)
RUN cp -rn ./api_node_modules/* ./node_modules/ 2>/dev/null || true && rm -rf ./api_node_modules

# Copy Prisma schema (needed for migrations in production)
COPY --from=builder /app/apps/api/prisma ./prisma

EXPOSE 3001
ENV PORT=3001
ENV NODE_ENV=production

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "dist/main.js"]
