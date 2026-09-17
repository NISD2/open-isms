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

# tsc globally for the GitHub-sourced dep that runs `tsc` in its `prepare`
# script after clone: nis2-gap-assessment-schema. The bun base image does
# not ship tsc. (nis2-supply-chain-questionnaire-schema used to be in this
# list and is now `workspace:*`, built from src by transpilePackages, so it
# needs no tsc here.)
#
# Pinned to the range the repo itself typechecks with. Unpinned, this
# resolved to whatever `latest` was on the day the layer was built: as of
# September 2026 that is typescript 7, the native rewrite, while
# package.json devDependencies still say ^6.0.3. The schema packages were
# being compiled by a different major than the one CI checks them with,
# and a floating version is not something a build should decide for you.
# Move this when the devDependency moves.
RUN bun install -g typescript@^6.0.3

COPY package.json bun.lock ./
COPY packages/grc-data-model/package.json ./packages/grc-data-model/
COPY packages/incident-notification-schema/package.json ./packages/incident-notification-schema/
COPY packages/isms-schema/package.json ./packages/isms-schema/
COPY packages/isms-trpc/package.json ./packages/isms-trpc/
COPY packages/isms-ui/package.json ./packages/isms-ui/
COPY packages/isms-lib/package.json ./packages/isms-lib/
COPY packages/nis2-supply-chain-questionnaire-schema/package.json ./packages/nis2-supply-chain-questionnaire-schema/
# The workspace globs in package.json are `packages/*` and `apps/*`, which
# is eight packages plus apps/reference, nine members, not the seven
# manifests copied above. Neither
# isms-pages nor apps/reference ships in this image, but bun resolves the
# whole workspace at once: with their manifests absent it dropped both
# members and rewrote the lockfile on every single build — the
# "Removed: 2 / Saved lockfile" pair in the deploy log. An install that
# rewrites its own lockfile is not installing what the lockfile pins, which
# is the one thing a lockfile is for. Two manifests, no dependency weight
# of their own (everything they need is already hoisted at the root), and
# the install below can be frozen.
COPY packages/isms-pages/package.json ./packages/isms-pages/
COPY apps/reference/package.json ./apps/reference/

# BuildKit cache mount: bun's package download cache persists between
# builds. First build downloads everything; subsequent builds with the
# same lockfile reuse the cache and skip network entirely.
#
# --frozen-lockfile makes the image's dependency tree exactly the one in
# bun.lock, and turns a drifted lockfile into a failed build here rather
# than a silent difference between what CI tested and what production runs.
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

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
#
# The cache mount is what makes a redeploy cheaper than a first build.
# webpack keeps a filesystem cache of compiled modules under
# .next/cache/webpack/{client,server,edge-server}-production, and until now
# every container build started with none of it: the 17.09 deploy spent 67
# of its 123 build seconds compiling from cold.
#
# Two full builds of this branch on one machine, the second with a one-line
# change to a component most public pages import, so the build re-ran
# rather than being skipped as a cached layer:
#
#   cache empty:  compile 75.0s, whole build step 133.5s
#   cache warm:   compile 33.1s, whole build step  74.1s
#
# A cache mount rather than a layer, because .next/cache is the one part of
# .next the runner stage deliberately does not want — it recreates the
# directory empty for the node user instead — so keeping it out of the
# image costs nothing and leaves the image exactly the size it was.
#
# sharing=locked serialises concurrent builds instead of letting two of
# them write one webpack cache. Coolify deploys a resource one at a time,
# so nothing normally waits; the release workflow builds each architecture
# on its own runner, where the mount starts empty and this is a no-op
# (type=gha cache does not carry cache mounts between runs).
#
# It costs disk on the build host: this cache reaches ~1.5GB for this app.
# `docker builder prune --filter type=exec.cachemount` reclaims it, at the
# price of one cold build afterwards.
RUN --mount=type=cache,target=/app/.next/cache,sharing=locked \
    node node_modules/next/dist/bin/next build --webpack

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
# The markdown behind /docs. Those pages are prerendered at build time and
# dynamicParams is false, so nothing should read these files at runtime; they
# are ~100 KB and shipping them means a page that does fall through to a render
# finds its source instead of throwing ENOENT.
COPY --from=builder /app/content ./content
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
# runtime-migrate.mjs hashes BOOTSTRAP_ADMIN_PASSWORD with bcrypt, at the same
# cost the sign-up route uses, so the account it writes is byte-compatible with
# one made through the form. Copied explicitly rather than trusted to Next's
# standalone tracer: the tracer follows imports from the app, and a refactor
# that stopped importing bcryptjs from a traced module would silently take the
# hasher out of the image and break first-boot for anyone with no mail.
COPY --from=deps /app/node_modules/bcryptjs ./node_modules/bcryptjs
# Framework reference data. runtime-migrate.mjs applies it when the catalogue
# is empty, so a fresh install has NIS 2 in it without a checkout or a seed
# script. Version-matched by construction: this file ships in the same image
# as the migrations whose schema it writes into.
COPY --from=builder /app/db ./db

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

# start-period covers the runtime migrate step on cold-start, and it is
# also how long Coolify waits before it first looks at the container: it
# sleeps the whole period, then polls. So the number is deploy latency, not
# just a grace window. On the 17.09 deploy the first probe returned 0 in
# 410ms, five seconds after the container started, and the deploy then sat
# idle for the remaining 55 seconds of a 243-second deploy.
#
# 20s keeps a 4x margin over that observed boot, and start-interval probes
# every 2s inside it so a faster boot is noticed sooner. A migration long
# enough to overrun 20s is not lost either: Coolify retries the check three
# times before it gives up, and a container that fails all of them leaves
# the previous version running, which is the behaviour we already rely on.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --start-interval=2s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r=>{if(!r.ok)throw 1}).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/bin/tini", "--"]
# Run migrations against $DATABASE_URL before serving. If the migrate
# step fails the container exits and Coolify keeps the previous
# version running. See scripts/runtime-migrate.mjs.
CMD ["sh", "-c", "node /app/scripts/runtime-migrate.mjs && exec node server.js"]
