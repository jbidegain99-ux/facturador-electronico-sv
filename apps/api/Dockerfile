FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/api ./apps/api
COPY packages ./packages
RUN npm install
WORKDIR /app/apps/api
RUN npx prisma generate
WORKDIR /app/packages/mh-client
RUN npm run build || echo "mh-client build skipped"
WORKDIR /app/packages/shared
RUN npm run build || echo "shared build skipped"
WORKDIR /app/apps/api
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/package.json ./
EXPOSE 3001
ENV PORT=3001
CMD ["node", "dist/main.js"]
