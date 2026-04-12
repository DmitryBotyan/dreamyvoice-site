# --- deps ---
FROM node:20-bookworm AS deps
WORKDIR /app
ENV NODE_ENV=production

# pnpm via corepack
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# --- build ---
FROM node:20-bookworm AS build
WORKDIR /app
RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma generate + build на этапе image build (а не при старте контейнера)
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
RUN pnpm prisma generate && pnpm build

# --- runner ---
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# минимальный рантайм: node_modules + dist + prisma schema (на всякий)
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json

EXPOSE 4000
CMD ["node", "dist/server.js"]

