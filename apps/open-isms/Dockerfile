# syntax=docker/dockerfile:1.7
#
# Dockerfile for the open-isms reference app.
#
# Distinct from the nisd2.eu private Dockerfile at the monorepo root —
# this one builds ONLY apps/open-isms + the OSS workspace packages.
# Designed for self-hosters running `docker compose up` from this dir.
#
# Multi-stage:
#   deps    — bun install (cached by package manifests)
#   builder — copy source + build standalone Next output
#   runner  — lean node:22-slim with standalone + drizzle SQL + migrate

# -----------------------------------------------------------------------------
# Stage 1: deps
# -----------------------------------------------------------------------------
FROM oven/bun:1.3.8 AS deps
WORKDIR /app

# tsc globally — some GitHub-sourced workspace deps run `tsc` in their
# `prepare` script after clone. The bun base image does not ship tsc.
RUN bun install -g typescript

# Workspace root manifest + per-package manifests for bun install caching.
COPY package.json bun.lock ./
COPY apps/open-isms/package.json ./apps/open-isms/
COPY packages/grc-data-model/package.json ./packages/grc-data-model/
COPY packages/incident-notification-schema/package.json ./packages/incident-notification-schema/
COPY packages/isms-schema/package.json ./packages/isms-schema/
COPY packages/isms-trpc/package.json ./packages/isms-trpc/
COPY packages/isms-ui/package.json ./packages/isms-ui/
COPY packages/isms-pages/package.json ./packages/isms-pages/
COPY packages/isms-lib/package.json ./packages/isms-lib/
COPY packages/isms-messages/package.json ./packages/isms-messages/

RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install

# -----------------------------------------------------------------------------
# Stage 2: builder
# -----------------------------------------------------------------------------
FROM oven/bun:1.3.8 AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Strip workspace-root files that belong to the PRIVATE nisd2.eu app —
# proxy.ts (Next middleware), app/, lib/, schema/, drizzle/, messages/,
# etc. Turbopack walks the monorepo root looking for entry files, and
# without this it picks up the private app's proxy.ts (which imports
# from @/i18n/routing that doesn't exist in the OSS slice).
#
# Anything under apps/open-isms/, packages/*/, and the workspace
# manifest stays. Everything else at the root gets nuked.
RUN find . -maxdepth 1 -mindepth 1 \
    ! -name apps \
    ! -name packages \
    ! -name node_modules \
    ! -name package.json \
    ! -name bun.lock \
    ! -name '.dockerignore' \
    -exec rm -rf {} +

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS=--max-old-space-size=4096

RUN bun run --cwd apps/open-isms build

# Bundle the migrate script with its deps (pg + pg-protocol + pg-pool +
# pg-types etc.) so it's a single self-contained file at runtime.
# Next's standalone tracer only walks routes, so this script's deps
# aren't picked up automatically.
RUN bun build --target=node --format=esm \
    --outfile /tmp/migrate.mjs \
    apps/open-isms/scripts/migrate.mjs

# -----------------------------------------------------------------------------
# Stage 3: runner
# -----------------------------------------------------------------------------
FROM node:22-bookworm-slim AS runner
WORKDIR /app

# tini for proper PID 1 signal handling
RUN apt-get update \
  && apt-get install -y --no-install-recommends tini \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Standalone Next output. For workspace apps, standalone puts the app
# at apps/open-isms/server.js and includes a slim node_modules with all
# transitive deps.
COPY --from=builder /app/apps/open-isms/.next/standalone ./
COPY --from=builder /app/apps/open-isms/.next/static ./apps/open-isms/.next/static
COPY --from=builder /app/apps/open-isms/public ./apps/open-isms/public

# Drizzle SQL files + journals for the runtime migrator. Three chains:
#   grc + isms come from the upstream packages.
#   auth is owned by this app (Auth.js tables).
COPY --from=builder /app/packages/grc-data-model/drizzle ./packages/grc-data-model/drizzle
COPY --from=builder /app/packages/isms-schema/drizzle ./packages/isms-schema/drizzle
COPY --from=builder /app/apps/open-isms/drizzle ./apps/open-isms/drizzle

# Runtime migrator — bundled in the builder stage so it carries pg + its
# transitive deps inline. Reads the journals, applies pending migrations,
# handles sentinel-based convergence for pre-existing schemas. See the
# source at apps/open-isms/scripts/migrate.mjs for the algorithm.
COPY --from=builder /tmp/migrate.mjs ./apps/open-isms/scripts/migrate.mjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://localhost:3000').then(r=>{if(!r.ok)throw 1}).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/bin/tini", "--"]
# Migrate then start the server. If migrate fails, the container exits
# and docker compose / orchestrator keeps the previous version running.
CMD ["sh", "-c", "node apps/open-isms/scripts/migrate.mjs && exec node apps/open-isms/server.js"]
