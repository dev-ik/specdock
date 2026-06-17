FROM node:20.19-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY apps/api/package*.json ./apps/api/
COPY packages/core/package*.json ./packages/core/
COPY packages/generator/package*.json ./packages/generator/
COPY packages/ui/package*.json ./packages/ui/
RUN npm ci

FROM node:20.19-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .
RUN npm run build

FROM node:20.19-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV WEB_DIST_DIR=/app/apps/web/dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/apps ./apps
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/api/health').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["npm", "run", "start", "--workspace", "@specdock/api"]
