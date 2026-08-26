# syntax=docker/dockerfile:1.7

# -----------------------------------------------------------------------------
# Stage 1: deps
# Install all dependencies. Cached as a layer when package.json, bun.lock,
# and workspace package manifests are unchanged — i.e. cached on every
# build that doesn't touch deps. Heaviest stage by far; isolating it
# means most rebuilds skip it entirely.
# -----------------------------------------------------------------------------
FROM oven/bun:1.3.8 AS deps

WORKDIR /app

# tsc globally for GitHub-sourced workspace deps that run `tsc` in their
# `prepare` script after clone (nis2-gap-assessment-schema, nis2-supply-
# chain-questionnaire-schema). The bun base image does not ship tsc.
RUN bun install -g typescript

COPY package.json bun.lock ./
COPY packages/grc-data-model/package.json ./packages/grc-data-model/
COPY packages/incident-notification-schema/package.json ./packages/incident-notification-schema/
COPY packages/isms-schema/package.json ./packages/isms-schema/
COPY packages/isms-trpc/package.json ./packages/isms-trpc/
COPY packages/isms-ui/package.json ./packages/isms-ui/
COPY packages/isms-lib/package.json ./packages/isms-lib/
COPY packages/isms-messages/package.json ./packages/isms-messages/
COPY packages/nis2-supply-chain-questionnaire-schema/package.json ./packages/nis2-supply-chain-questionnaire-schema/

# BuildKit cache mount: bun's package download cache persists between
# builds. First build downloads everything; subsequent builds with the
# same lockfile reuse the cache and skip network entirely.
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install

# -----------------------------------------------------------------------------
# Stage 2: builder
# Copy source + build. Reuses deps from stage 1; only rebuilds when
# source files change.
# -----------------------------------------------------------------------------
# Builder stage uses Node.js directly. Bun 1.3.8 segfaults during
# next build's page-data collection (panic: SIGSEGV in Bun's runtime,
# not in our code). The build script is plain `next build` so Node
# runs it natively. Deps still come from the Bun-based deps stage.
FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/grc-data-model/node_modules ./packages/grc-data-model/node_modules
COPY --from=deps /app/packages/incident-notification-schema/node_modules ./packages/incident-notification-schema/node_modules
COPY . .

# Strip apps/ from the build context — apps/reference is a sibling Next.js
# app that isn't part of the SaaS image. Removing it before bun run build
# keeps the standalone tracer focused on the SaaS app only.
RUN rm -rf apps

ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=1
ENV NEXT_TELEMETRY_DISABLED=1
# Webpack + Next 16 + ~200 routes needs 4GB heap (peaks ~3.5GB during
# compile). Static-page generation is run in-process via
# experimental.workerThreads=false in next.config.ts so the worker
# child process doesn't ALSO claim 4GB and double the host's peak RSS.
ENV NODE_OPTIONS=--max-old-space-size=4096

# Migrations DO NOT run at build time — Coolify's BuildKit build network
# does not consistently reach Coolify-managed Postgres hosts even with
# --add-host. They run at container startup instead, via
# scripts/runtime-migrate.mjs, which the runner stage's ENTRYPOINT
# chains before exec'ing node server.js.
#
# --webpack pins the webpack builder. Next 16 runs `next build` on
# Turbopack by default, whose compile peaks well past the 4GB heap set
# above and gets OOM-killed (exit 137) on the Coolify builder. The 4GB
# tuning and this app's Tailwind v4 setup target webpack; keep it there.
RUN node node_modules/next/dist/bin/next build --webpack

# -----------------------------------------------------------------------------
# Stage 3: runner
# Lean runtime. Only standalone output, static assets, public, and the
# drizzle migrations. No source, no devDependencies, no build tooling.
# -----------------------------------------------------------------------------
FROM node:22-bookworm-slim AS runner

WORKDIR /app

# tini for proper PID 1 signal handling. SIGTERM from Coolify on redeploy
# propagates through tini to Node cleanly.
RUN apt-get update \
  && apt-get install -y --no-install-recommends tini \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV AUTH_TRUST_HOST=true
ENV NEXT_TELEMETRY_DISABLED=1

# Stamped by the release workflow from the git tag. An image built any other
# way keeps `dev`, which the app reports as an unversioned build and never
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# Workaround for a known Next.js standalone bug with route groups + i18n:
# *_client-reference-manifest.js files inside (group)/ folders sometimes
# aren't copied into the standalone output, causing runtime errors like:
#   InvariantError: The client reference manifest for route "/[locale]"
#   does not exist. This is a bug in Next.js.
# Overlay the full .next/server/app from the regular build over the
# standalone copy. Same files, plus the missing manifests.
COPY --from=builder /app/.next/server/app ./.next/server/app
# Migration SQL kept alongside runtime so Coolify pre-deploy can run
# drizzle-kit migrate. The drizzle-kit binary is NOT included; ship the
# SQL only.
#
# Three layered drizzle directories — each owned by its respective
# package, applied in dependency order by `bun db:migrate`:
#   packages/grc-data-model/drizzle  → GRC entity tables (framework, asset, …)
#   packages/isms-schema/drizzle     → ISMS process tables (audit_log, evidence, …)
#   drizzle/                         → SaaS-only tables (lead, email_otp, …)
COPY --from=builder /app/packages/grc-data-model/drizzle ./packages/grc-data-model/drizzle
COPY --from=builder /app/packages/grc-data-model/drizzle.config.ts ./packages/grc-data-model/drizzle.config.ts
COPY --from=builder /app/packages/grc-data-model/package.json ./packages/grc-data-model/package.json
COPY --from=builder /app/packages/isms-schema/drizzle ./packages/isms-schema/drizzle
COPY --from=builder /app/packages/isms-schema/drizzle.config.ts ./packages/isms-schema/drizzle.config.ts
COPY --from=builder /app/packages/isms-schema/package.json ./packages/isms-schema/package.json
COPY --from=builder /app/drizzle ./drizzle
# Runtime migration runner. See scripts/runtime-migrate.mjs for the
# rationale and the embedded drizzle-orm-compatible migrator.
COPY --from=builder /app/scripts/runtime-migrate.mjs ./scripts/runtime-migrate.mjs

RUN mkdir -p .next/cache && chown -R node:node .next/cache

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Stamped by the release workflow from the git tag. An image built any other
# way keeps `dev`, which the app reports as an unversioned build and never
# compares against published releases.
#
# Deliberately the last thing in the file: changing it invalidates only these
# final layers, so building a second image that differs solely by version
# reuses the whole builder stage. The self-host workflow relies on that to
# test a real container swap without paying for two full builds.
ARG APP_VERSION=dev
ENV APP_VERSION=${APP_VERSION}

USER node

# Health check timing is generous to cover the runtime migrate step on
# cold-start. start-period 60s allows the migrate + server boot to
# complete before health probes begin.
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r=>{if(!r.ok)throw 1}).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/bin/tini", "--"]
# Run migrations against $DATABASE_URL before serving. If the migrate
# step fails the container exits and Coolify keeps the previous
# version running. See scripts/runtime-migrate.mjs.
CMD ["sh", "-c", "node /app/scripts/runtime-migrate.mjs && exec node server.js"]
