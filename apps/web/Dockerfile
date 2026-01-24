# Build stage
FROM node:20-alpine AS builder

# Required for native dependencies
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Build arguments for environment variables
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Copy root package files
COPY package*.json ./

# Copy workspace packages
COPY apps/web ./apps/web
COPY packages ./packages

# Install dependencies
RUN npm install

# Build shared packages first
WORKDIR /app/packages/shared
RUN npm run build || echo "shared build skipped"

# Build Next.js application
WORKDIR /app/apps/web
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

# Required for native dependencies
RUN apk add --no-cache libc6-compat

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

# Set ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

CMD ["node", "apps/web/server.js"]
