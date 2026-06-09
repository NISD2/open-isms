# open-isms

Open-source NIS 2 / GRC ISMS toolkit. Schemas, framework data, tRPC scaffolding, and shadcn UI primitives for building a self-hostable Information Security Management System aligned with the EU NIS 2 directive, GDPR, EU AI Act, CRA, and ISO 27001:2022.

> **Status**: workspace + library today. The reference app at `apps/open-isms` is a skeleton; the schemas and primitives are production-ready and powering [nisd2.eu](https://www.nisd2.eu).

## Quick start

```bash
git clone https://github.com/NISD2/open-isms.git
cd open-isms
bun install
cd apps/open-isms
bun run dev   # http://localhost:3027
```

The reference app boots a landing page. To actually use the toolkit, import the workspace packages into your own Next.js / Node application.

## Layout

| Path | Purpose |
|---|---|
| `packages/grc-data-model/` | GRC entity schemas + NIS 2 / GDPR / EU AI Act / CRA / ISO 27001 framework data. 217 requirements, 111 cross-framework satisfaction pairs. |
| `packages/incident-notification-schema/` | EU Article 23 NIS 2 incident notification schema (CIR 2024/2690 + ENISA TIG + W3C DPV NIS 2 vocabulary aligned). |
| `packages/isms-schema/` | ISMS process tables — audit log, evidence, sign-offs, exercises, training, notifications. |
| `packages/isms-trpc/` | tRPC setup factory + chained-checksum audit middleware. |
| `packages/isms-ui/` | shadcn UI primitives with the same look & feel as nisd2.eu. |
| `packages/isms-pages/` | Shared page components (landing, info, marketing). |
| `packages/isms-lib/` | Pure helpers — deadline math, formatting. |
| `packages/isms-messages/` | i18n message catalog registry (EN/DE/NL). |
| `apps/open-isms/` | Reference Next.js app skeleton — extend it into a full ISMS. |

## Database migrations

The mirror does **not** ship pre-generated SQL migrations. Run `bun run --cwd packages/grc-data-model db:generate` and the equivalent for `packages/isms-schema/` to produce migrations from the workspace schemas. Each package owns its own `drizzle/` directory and its own `__drizzle_migrations_*` bookkeeping table — the same pattern that runs in production on nisd2.eu.

## Contributing

This repository is a mirror of the OSS slice of the larger [nisd2.eu monorepo](https://www.nisd2.eu). PRs are welcome but the OSS `main` branch is force-pushed by the maintainer on each upstream sync — your commits get re-applied upstream rather than merged directly.

Most useful contribution paths:
- Issues / discussions for design feedback, bug reports, regulatory updates
- PRs targeting a specific package — clear about which one, with a test case
- Mappings for national NIS 2 portals beyond Germany (`packages/incident-notification-schema/`)

## License

AGPL-3.0-or-later. See [`LICENSE`](./LICENSE). The data model and framework metadata in `packages/grc-data-model/` and `packages/incident-notification-schema/` are dual-licensed — see the per-package README for details.

## Maintainer

Maintained by [Kardashev Catalyst UG (haftungsbeschränkt)](https://www.nisd2.eu/impressum) for [nisd2.eu](https://www.nisd2.eu) — a free EU NIS 2 compliance platform serving European organisations under the directive. Contact: [contact@nisd2.eu](mailto:contact@nisd2.eu). Security disclosures: see `SECURITY.md` in `packages/grc-data-model/`.
