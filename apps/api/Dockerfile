FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/api ./apps/api
COPY packages ./packages
RUN npm ci --workspace=apps/api
RUN cd apps/api && npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./
EXPOSE 3001
ENV PORT=3001
CMD ["node", "dist/main.js"]
