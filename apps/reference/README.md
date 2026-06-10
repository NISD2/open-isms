# open-isms (reference app)

Self-hostable Next.js app skeleton for an NIS 2 ISMS, wired up to the workspace packages (`@nisd2/grc-data-model`, `@nisd2/isms-schema`, etc.).

> **Status**: hello-world landing page today. The portal pages (compliance, assets, risks, suppliers, incidents) are being ported in from the upstream nisd2.eu monorepo. Until they land, this app demonstrates the workspace + Docker setup but does not yet expose the full ISMS.

## Quick start (Docker)

```bash
cd apps/reference
cp .env.example .env
# Set AUTH_SECRET:
sed -i.bak "s|^AUTH_SECRET=$|AUTH_SECRET=$(openssl rand -base64 32)|" .env && rm .env.bak
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000).

The stack: Postgres 17 + the Next.js app. On first boot the migrator creates the `grc` and `isms` chains' tables in the empty database and records baselines in `drizzle.__drizzle_migrations_{grc,isms}`. On subsequent restarts it's a no-op.

## Quick start (local dev, no Docker)

You need Postgres reachable somewhere. With Bun installed:

```bash
# from the workspace root (one level up from this directory)
bun install

# set DATABASE_URL in your shell, then:
bun --cwd packages/grc-data-model db:migrate
bun --cwd packages/isms-schema db:migrate

cd apps/reference
bun run dev   # http://localhost:3027
```

## Files in this app

```
apps/reference/
├── app/                    # Next.js App Router routes
│   ├── layout.tsx
│   ├── page.tsx            # landing page (placeholder)
│   └── globals.css
├── scripts/
│   └── migrate.mjs         # runtime DB migrator (runs at container start)
├── public/                 # static assets served at /
├── Dockerfile              # multi-stage build (deps → builder → runner)
├── docker-compose.yml      # Postgres + app for self-hosters
├── .env.example            # template for environment variables
├── package.json
├── next.config.ts
├── postcss.config.mjs
└── tsconfig.json
```

## What's NOT here yet

- Auth (Auth.js / NextAuth with email magic links, planned)
- The ISMS portal pages (compliance, assets, risks, suppliers, incidents, training, reviews) — these live in the upstream monorepo and are being ported in
- Translation strings (the i18n registry exists, the catalog needs to be brought over)

These are tracked roadmap items, not bugs. See the upstream README for the full project picture.

## License

AGPL-3.0-or-later. See `LICENSE` in the workspace root.
