Bun 1.3 or later, a Postgres you can write to, and about five minutes.

```bash
git clone https://github.com/NISD2/open-isms.git
cd open-isms
bun install
```

## A database

The repository's own `docker-compose.yml` is the development stack, and it differs from the self-host one in a way worth knowing: it **builds** the image from source rather than pulling it. Building takes 10 to 20 minutes and about 8 GB of RAM. For most work you do not need it: run just the database and point the dev server at it.

```bash
docker compose up -d postgres
```

Then create `.env` from the example and set at least:

```ini
DATABASE_URL=postgres://openisms:openisms@localhost:5432/openisms
AUTH_SECRET=   # openssl rand -base64 32
ENABLE_DEV_AUTH=true
```

`ENABLE_DEV_AUTH` adds a password-less login provider so you do not need a mail provider locally. It is guarded by a `NODE_ENV !== "production"` check as well as the variable, so it cannot be switched on in a released image.

Apply migrations and load the framework data:

```bash
bun db:migrate
bun run drizzle/seed.ts
```

The seed creates a **Dev GmbH** tenant with a `dev@nis2.local` user, which is what you sign in as. It also clears framework-linked rows for every company in the database before writing, so keep it pointed at a local database. It refuses any other host.

## Run it

```bash
bun run dev          # http://localhost:3026
```

The dev script passes `--webpack` on purpose. Turbopack is available as `bun run dev:turbo` and is not the supported path: the production build is webpack, and differences between the two have cost debugging time before.

## Before you push

```bash
bun run typecheck    # must pass clean, strict mode
bun run test:unit
bun run build        # the full Next.js build CI runs
```

CI runs more than this, including migration checks and shellcheck. See [Testing](/docs/contributing/testing).

## Conventions

- **TypeScript strict.** No `as any`, no non-null assertions. Use explicit checks or narrowing.
- **Bun only.** No `npm`, `yarn` or `pnpm` in commits.
- **Never `drizzle-kit push`.** Always `bun db:generate` then `bun db:migrate`. Push bypasses migration tracking and produces state drift. See [Migrations](/docs/contributing/migrations).
- **No emojis** in code or commit messages.
- **No em-dashes** in user-facing copy.
- **Conventional commits**: `feat(area):`, `fix(area):`, `docs:`, `refactor:`, `chore:`.
- **No AI co-author lines** in commit messages.

## Working on the schemas alone

The workspace packages have their own scripts, so you can iterate on framework data without the app running:

```bash
bun run --cwd packages/grc-data-model db:generate
bun test packages/
```

## The reference app

`apps/reference` is a much smaller thing: a minimal demo of the workspace packages with a landing page, two portal pages, and magic-link auth that needs an SMTP transport you write yourself. Use it to understand the packages, not to run an ISMS.

```bash
cd apps/reference
cp .env.example .env      # set AUTH_SECRET
docker compose up --build # http://localhost:3000
```
