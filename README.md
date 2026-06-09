# open-isms

Open-source NIS 2 / GRC ISMS toolkit. Schemas, framework data, and a reference Next.js app for building a self-hostable Information Security Management System aligned with the EU NIS 2 directive, GDPR, EU AI Act, CRA, and ISO 27001:2022.

Powering [nisd2.eu](https://www.nisd2.eu) — the same code, extracted as OSS.

## Status

| Package | Published to npm | Notes |
|---|---|---|
| `@nisd2/grc-data-model` | yes | Framework data + entity schemas. Reusable in any GRC tool. |
| `@nisd2/incident-notification-schema` | yes | NIS 2 §23(4) structured incident notification format. |
| `@nisd2/isms-schema` | no — workspace only | ISMS operational schema (audit-log, sign-off, policies, etc.). |
| `@nisd2/isms-ui` | no — workspace only | shadcn-based UI primitives. |
| `@nisd2/isms-pages` | no — workspace only | Pre-translated page components. |
| `@nisd2/isms-lib` | no — workspace only | Compliance helpers (deadlines, format). |
| `@nisd2/isms-trpc` | no — workspace only | tRPC setup + audit middleware. |
| `@nisd2/isms-messages` | no — workspace only | i18n catalogs for ISMS UI. |

Two packages publish; the rest live here as workspace siblings — fork or clone to use them, no npm artifact yet.

## Quick start

```bash
git clone https://github.com/NISD2/open-isms.git
cd open-isms
bun install
cd apps/open-isms
cp .env.example .env  # then set AUTH_SECRET via openssl rand -base64 32
docker compose up --build
# open http://localhost:3000
```

Reference app boots Postgres + the Next.js app, runs schema migrations, seeds NIS 2 (12 categories, 49 requirements), gates routes behind email magic-link auth.

## Layout

```
apps/open-isms/    # reference app: Next.js 16 + Auth.js + Drizzle + Postgres
packages/
  grc-data-model/                  # ← published
  incident-notification-schema/    # ← published
  isms-schema/                     # workspace only
  isms-ui/                         # workspace only
  isms-pages/                      # workspace only
  isms-lib/                        # workspace only
  isms-trpc/                       # workspace only
  isms-messages/                   # workspace only
.github/workflows/
  ci.yml         # typecheck + build on PR
  release.yml    # publishes on tag push (vX.Y.Z)
scripts/
  release.ts          # bump all package versions, commit, tag
  publish-all.ts      # publish public packages to npm (CI only)
  check-versions.ts   # verify tag matches package versions
  audit-dep-graph.ts  # inspect import resolution across the monorepo
```

## Contributing

1. Fork, branch, make changes
2. `bun install && bun run typecheck && bun run build`
3. Open a PR

Releases are cut by maintainers via `bun scripts/release.ts <version>` + tag push.

## License

The root project + workspace-only packages are [AGPL-3.0-or-later](./LICENSE). Individual published packages may use more permissive licenses — see each package's own LICENSE file:

| Package | License |
|---|---|
| `@nisd2/grc-data-model` | MIT |
| `@nisd2/incident-notification-schema` | Dual: AGPL-3.0 + Commercial (see [LICENSE](./packages/incident-notification-schema/LICENSE)) |
| `@nisd2/isms-*` (workspace-only) | AGPL-3.0-or-later |
