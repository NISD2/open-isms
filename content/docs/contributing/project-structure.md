One repository, one bun workspace. The application at the root, the reusable half in `packages/`.

```text
app/                    the Next.js App Router application
  [locale]/             everything translated: marketing, portal, supplier, training, wiki
  docs/                 these pages, English only, outside the locale tree
  api/                  route handlers: auth, cron, trpc, health, exports
components/             app-specific React components
lib/                    app-specific helpers: auth, mail, db, security, ai
server/                 tRPC routers and their helpers
schema/                 the app's own Drizzle tables, re-exporting the packages
drizzle/                the `saas` migration chain, plus seed.ts
messages/               i18n catalogues, ten locales
i18n/                   next-intl routing and request configuration
content/docs/           the markdown behind these pages

packages/
  grc-data-model/                 framework data + entity model, published to npm (MIT)
  incident-notification-schema/   NIS 2 Article 23 format, published to npm (dual)
  nis2-supply-chain-questionnaire-schema/  supplier questions, published to npm (dual)
  isms-schema/                    operational ISMS tables: sign-off, evidence, audit, policies
  isms-ui/                        shadcn-based UI primitives
  isms-pages/                     pre-translated page components
  isms-lib/                       compliance helpers: deadlines, formatting
  isms-trpc/                      tRPC setup and the audit middleware
  isms-messages/                  package-level i18n catalogues

apps/reference/         minimal demo of the packages, its own compose file
courses/                NIS 2 CEO course, tabletop exercises, CRA SBOM
data/                   public reference data: registration portals, timeline
docs/                   deployment and legal reference markdown
scripts/                operational and release tooling
e2e/                    Playwright specs and their fixtures
.github/workflows/      CI, e2e, release, npm publishing, self-host drills
```

## Where a change belongs

| Changing | Goes in |
|---|---|
| A requirement's wording, article reference or mapping | `packages/grc-data-model/src/frameworks/` |
| A new table for ISMS process data | `packages/isms-schema/src/tables/` plus a migration |
| A table only the SaaS needs (billing, newsletter, sessions) | `schema/` plus a migration in `drizzle/` |
| A UI primitive several surfaces use | `packages/isms-ui/` |
| A page or a flow | `app/[locale]/` |
| Translated copy | `messages/` and `packages/isms-messages/` |
| Operator or developer documentation | `content/docs/` |

## Three path aliases worth knowing

```ts
import { Button } from "@/components/ui/button";     // packages/isms-ui
import { requirement } from "@nisd2/grc-data-model/schema";
import { db } from "@/lib/db";                        // the app root
```

`@/components/ui/*` does **not** resolve inside the app: it is mapped to `packages/isms-ui/src/components/ui/*` in `tsconfig.json`, so shadcn primitives stay in one place and the app never grows a second copy.

## Three migration chains, not one

`packages/grc-data-model/drizzle`, `packages/isms-schema/drizzle` and `drizzle/` each carry their own migrations and their own bookkeeping table. They run in that order at container start. This is the single most surprising thing about the layout, and [Migrations](/docs/contributing/migrations) explains why it is that way.
