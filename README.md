<p align="center">
  <img src=".github/social-preview.png" alt="open-isms: the free, open-source ISMS for the EU NIS 2 Directive" width="860">
</p>

<p align="center">
  <a href="https://github.com/NISD2/open-isms/tags"><img src="https://img.shields.io/github/v/tag/NISD2/open-isms?logo=github&label=version&color=284b63" alt="Latest version"></a>
  <a href="https://www.npmjs.com/package/@nisd2/grc-data-model"><img src="https://img.shields.io/npm/v/@nisd2/grc-data-model.svg?logo=npm&label=grc-data-model" alt="npm"></a>
  <a href="https://github.com/NISD2/open-isms/pkgs/container/open-isms"><img src="https://img.shields.io/badge/ghcr.io-open--isms-284b63?logo=docker&logoColor=white" alt="Container image"></a>
  <a href="https://github.com/NISD2/open-isms/actions/workflows/ci.yml"><img src="https://github.com/NISD2/open-isms/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/NISD2/open-isms/actions/workflows/release.yml"><img src="https://github.com/NISD2/open-isms/actions/workflows/release.yml/badge.svg" alt="Release"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-blue.svg" alt="License: AGPL-3.0"></a>
  <a href="https://www.nisd2.eu"><img src="https://img.shields.io/badge/site-nisd2.eu-284b63.svg" alt="nisd2.eu"></a>
</p>

---

The platform behind [nisd2.eu](https://www.nisd2.eu): a self-hostable Information Security Management System built for the EU NIS 2 Directive, with GDPR, the EU AI Act, and the CRA alongside it.

Most compliance tooling treats evidence as a folder of PDFs you assemble the week before an audit. open-isms inverts that. Every requirement carries an owner, a deadline, and a sign-off, so assignments, approvals, and an append-only audit trail become your evidence as you operate, not something you reconstruct after the fact.

Free and open source. AGPL-3.0. Mission: halve Europe's NIS 2 compliance bill.

## What's in here

```
apps/
  reference/                      # minimal docker-compose demo (Postgres + Next.js)
                                  # boot stack, gates routes behind email magic links

packages/
  grc-data-model/                 # framework data + entity model (NIS 2, GDPR, EU AI Act, CRA)
  incident-notification-schema/   # NIS 2 §23(4) incident notification format
  isms-schema/                    # operational ISMS schema (audit-log, sign-off, evidence, policies, training)
  isms-ui/                        # shadcn-based UI primitives
  isms-pages/                     # pre-translated page components
  isms-lib/                       # compliance helpers (deadlines, format)
  isms-trpc/                      # tRPC setup + audit middleware
  isms-messages/                  # i18n catalogs

app/                              # the production SaaS — marketing + portal + supplier + training
components/  lib/  schema/  server/  drizzle/  messages/  i18n/   # SaaS app code
courses/                          # NIS 2 CEO course content + tabletop exercises + CRA SBOM
data/  docs/                      # public reference data + deployment docs
public/                           # static assets

scripts/                          # operational + release tooling
.github/workflows/                # CI + release pipeline
```

`grc-data-model` and `incident-notification-schema` are published to npm. The other packages are workspace-only (consumed via bun workspaces; not on npm yet).

## Quick start (local dev)

```bash
git clone https://github.com/NISD2/open-isms.git
cd open-isms
bun install
bun run dev               # http://localhost:3026
```

## Quick start (self-host the whole platform)

One command. It checks Docker, downloads the compose file, generates the
secrets, picks free ports, starts the stack and waits until it answers.

```bash
curl -fsSL https://raw.githubusercontent.com/NISD2/open-isms/main/install.sh | bash
# http://localhost:3026
```

Rather read it first? `curl -fsSL … -o install.sh && less install.sh && bash install.sh`.

By hand instead, three files and a published image, no clone and nothing
compiled:

```bash
mkdir open-isms && cd open-isms
curl -o compose.yaml https://raw.githubusercontent.com/NISD2/open-isms/main/compose.self-host.yml
curl -o .env         https://raw.githubusercontent.com/NISD2/open-isms/main/.env.self-host.example
curl -o Caddyfile    https://raw.githubusercontent.com/NISD2/open-isms/main/Caddyfile.self-host.example
# fill in the required values in .env, then:
docker compose up -d                        # http://localhost:3026
```

Nobody can register until the instance can send email, because sign-up verifies
the address with a one-time code. Until you configure a provider, the code goes
to the log: `docker compose logs app | grep "sign-in code"`.

**[nisd2.eu/docs](https://www.nisd2.eu/docs)** is the full documentation:
installation, every environment variable, storage, email, TLS, updates,
backup and restore, and the platform's own data model. The same material is
in this repository as **[docs/self-hosting.md](./docs/self-hosting.md)**,
**[docs/updating.md](./docs/updating.md)** and
**[docs/backup.md](./docs/backup.md)**.

Framework data loads itself: the container fills an empty requirement catalogue
from `db/framework-seed.sql` at startup, so a fresh install has NIS 2 in it
without a checkout or a seed script.

For the minimal workspace demo instead of the full platform:

```bash
cd apps/reference
cp .env.example .env      # set AUTH_SECRET via `openssl rand -base64 32`
docker compose up --build # http://localhost:3000
```

## Quick start (just the schema packages)

The framework data and schemas are published to npm on their own, so you can
build against them without running any of this. There is no npm package for
the platform itself: open-isms ships as a container image, see above.

```bash
bun add @nisd2/grc-data-model @nisd2/incident-notification-schema @nisd2/nis2-supply-chain-questionnaire-schema
```

| package | what it gives you |
|---|---|
| [`@nisd2/grc-data-model`](https://www.npmjs.com/package/@nisd2/grc-data-model) | 219 requirements across NIS 2, GDPR, the EU AI Act, the CRA and ISO 27001:2022, with 125 cross-framework satisfaction pairs and Drizzle-compatible Postgres schemas |
| [`@nisd2/incident-notification-schema`](https://www.npmjs.com/package/@nisd2/incident-notification-schema) | the NIS 2 Article 23 incident notification format as a typed Zod schema |
| [`@nisd2/nis2-supply-chain-questionnaire-schema`](https://www.npmjs.com/package/@nisd2/nis2-supply-chain-questionnaire-schema) | the questions a regulated entity asks its suppliers, as Zod plus JSON Schema |

```ts
import { nis2Categories, getNis2RequirementsForCategory } from "@nisd2/grc-data-model/frameworks";
import { complianceFramework, requirement } from "@nisd2/grc-data-model/schema";
```

Per framework: NIS 2 12 categories / 49 requirements, GDPR 6 / 9, EU AI Act
10 / 24, CRA 10 / 21, ISO 27001:2022 5 / 116.

## Legal scope

- **EU Directive**: 2022/2555 (NIS 2)
- **German transposition**: NIS2UmsuCG → revised BSIG (2025)
- **Implementing Regulation**: Commission Implementing Regulation (EU) 2024/2690
- **Effective**: 6 December 2025
- **Registration deadline**: 6 March 2026

## Tech stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 + React 19 (App Router, SSR-first) |
| Language | TypeScript 6 strict mode |
| Styling | Tailwind CSS 4 + shadcn |
| Validation | Zod 4 |
| ORM | Drizzle 0.45 (Postgres) |
| API | tRPC 11 |
| Auth | Auth.js v5 (email and password, one-time code verification, optional Google OAuth) |
| i18n | next-intl, 10 locales (DE/EN/NL/FR/IT/ES/PL/CS/PT/RO) |
| AI | Vercel AI SDK + xAI Grok for form prefill |
| Runtime | Bun 1.3+ |
| Hosting | Coolify (self-hosted) |

## Contributing

See [CONTRIBUTING.md](./.github/CONTRIBUTING.md). External PRs welcome — particularly:

- New framework articles / mappings (`packages/grc-data-model/src/frameworks/`)
- Translation work (`messages/`, `packages/isms-messages/`)
- Schema improvements (`packages/isms-schema/src/tables/`)
- Documentation and examples

For security disclosures, see [SECURITY.md](./.github/SECURITY.md).

## License

[AGPL-3.0-or-later](./LICENSE) for the app, scripts, and workspace-only packages.

**Course content is [CC BY 4.0](./courses/LICENSE).** Everything under `courses/` — lesson text, quizzes, appendices and the typeset PDF editions — may be reused, adapted and republished under your own name, including commercially. Attribution is the only condition. Chambers of commerce, associations and schools are explicitly welcome to turn it into their own guidance under their own branding.

Published npm packages have their own licenses:

| Package | License |
|---|---|
| `@nisd2/grc-data-model` | MIT |
| `@nisd2/nis2-supply-chain-questionnaire-schema` | MIT (code) + CC BY 4.0 (content) |
| `@nisd2/incident-notification-schema` | Dual: AGPL-3.0 + commercial |
| `@nisd2/isms-*` (workspace-only) | AGPL-3.0-or-later |
