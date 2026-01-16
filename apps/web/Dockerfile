FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/web ./apps/web
COPY packages ./packages
RUN npm ci --workspace=apps/web
RUN cd apps/web && npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./.next/static
COPY --from=builder /app/apps/web/public ./public
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
