FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/web ./apps/web
COPY packages ./packages
RUN npm install
WORKDIR /app/apps/web
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "apps/web/server.js"]
