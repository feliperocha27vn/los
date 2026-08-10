FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

FROM base AS api-build
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY api/package.json ./api/
COPY api/tsconfig.json ./api/
COPY api/tsup.config.ts ./api/
COPY api/src ./api/src
COPY api/drizzle ./api/drizzle
COPY api/biome.json ./api/
RUN pnpm install --frozen-lockfile
WORKDIR /app/api
RUN pnpm build

FROM base AS api
WORKDIR /app
RUN apk add --no-cache openssl curl
ENV NODE_ENV=production
COPY --from=api-build /app/api/dist ./api/dist
COPY --from=api-build /app/api/drizzle ./api/drizzle
COPY --from=api-build /app/api/package.json ./api/package.json
COPY --from=api-build /app/node_modules ./node_modules
COPY --from=api-build /app/api/node_modules ./api/node_modules
COPY --from=api-build /app/package.json ./package.json
COPY --from=api-build /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
WORKDIR /app/api
EXPOSE 3333
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS http://localhost:3333/health || exit 1
CMD ["sh", "-c", "node dist/start.js"]
