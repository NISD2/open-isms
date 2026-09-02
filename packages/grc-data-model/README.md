# @nisd2/grc-data-model

**The canonical EU cybersecurity + AI compliance data model.** 219 requirements across NIS 2, GDPR, EU AI Act, CRA, and ISO 27001:2022. 125 cross-framework satisfaction pairs. Drizzle schemas, framework metadata, article-level mappings. MIT-licensed. Used in production by [nisd2.eu](https://www.nisd2.eu).

**[Browse the full reference (REFERENCE.md)](./REFERENCE.md)** — every requirement, every pair, every article-level mapping in one document.

## Install

```bash
bun add @nisd2/grc-data-model
```

## Use

```ts
import { supplier, asset, risk, incident } from "@nisd2/grc-data-model/schema";
import { nis2Categories, getNis2RequirementsForCategory } from "@nisd2/grc-data-model/frameworks";
import { nis2GdprSatisfactionPairs } from "@nisd2/grc-data-model/satisfaction-pairs";
import { nis2GdprMapping } from "@nisd2/grc-data-model/mappings/nis2-gdpr";
```

Drizzle config:

```ts
schema: [
  "./node_modules/@nisd2/grc-data-model/src/enums.ts",
  "./node_modules/@nisd2/grc-data-model/src/schema/*.ts",
],
```

Seed your own database with the four frameworks (NIS 2, GDPR, EU AI Act, CRA):

```ts
import { drizzle } from "drizzle-orm/node-postgres";
import {
  euAiActCategories,
  getEuAiActRequirementsForCategory,
} from "@nisd2/grc-data-model/frameworks";
import { aiActNis2SatisfactionPairs } from "@nisd2/grc-data-model/satisfaction-pairs";
import { seedFramework, linkSatisfactionPairs } from "@nisd2/grc-data-model/seed";

const db = drizzle(pool);

await seedFramework(db, {
  code: "eu_ai_act",
  version: "2024/1689",
  effectiveDate: "2024-08-01",
  codePrefix: "AI-",
  sidebarLabel: "aiact",
  categories: euAiActCategories,
  getRequirements: getEuAiActRequirementsForCategory,
});

await linkSatisfactionPairs(db, aiActNis2SatisfactionPairs);
```

Each call is idempotent and scoped to the framework code; existing rows for other frameworks and any operational data are untouched.

## Subpaths

| Subpath | Contents |
|---|---|
| `/schema` | Drizzle tables: framework, requirement, requirement-satisfaction, supplier, asset, risk, incident |
| `/enums` | 16 GRC-core PG enums (incident severity, evidence type, transfer mechanism, etc.) |
| `/frameworks` | Categories + requirements for NIS 2 (12 / 49), GDPR (5 / 7), EU AI Act (5 / 24), CRA (4 / 21), ISO 27001:2022 (5 / 116) |
| `/satisfaction-pairs` | NIS 2 ↔ GDPR (11), AI Act ↔ NIS 2 (7), AI Act ↔ GDPR (5), CRA ↔ NIS 2 (9), CRA ↔ AI Act (4), CRA ↔ GDPR (2), ISO 27001 ↔ NIS 2 (73) |
| `/mappings/nis2-gdpr` | Article-level concept mapping |
| `/seed` | `seedFramework(db, spec)` and `linkSatisfactionPairs(db, pairs)` to populate a Postgres database with the framework data |

## Boundary

**In:** GRC core (suppliers, assets, risks, incidents, framework metadata, attestations).
**Out:** tenant root (`company`, `user`), audit log, notifications, app-specific portals — those belong with the consumer.

Cross-boundary FK constraints (e.g. `supplier.company_id → company.id`) are not declared in this package; the consumer's own migration adds them.

## Stability

All top-level exports follow semver. Breaking changes (renaming, removing, or restructuring exported tables, enums, frameworks data, or satisfaction pairs) bump the major version. New tables, columns, requirements, or pairs ship as a minor bump.

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md). Issue templates for [incorrect mappings](./.github/ISSUE_TEMPLATE/incorrect-mapping.md), [missing pairs](./.github/ISSUE_TEMPLATE/missing-pair.md), and [bugs](./.github/ISSUE_TEMPLATE/bug.md). Security policy at [`SECURITY.md`](./SECURITY.md).

## Maintainer

Maintained by [Simon Orzel](https://www.nisd2.eu/impressum) for [nisd2.eu](https://www.nisd2.eu) — a free EU NIS2 compliance platform. Contact: [contact@nisd2.eu](mailto:contact@nisd2.eu).

## Licence

MIT — see [`LICENSE`](./LICENSE).
