The framework data and the schemas are published on npm on their own, so you can build against them without running any of this. There is no npm package for the platform itself: open-isms ships as a container image.

```bash
bun add @nisd2/grc-data-model
bun add @nisd2/incident-notification-schema
bun add @nisd2/nis2-supply-chain-questionnaire-schema
```

## @nisd2/grc-data-model

219 requirements across NIS 2, GDPR, the EU AI Act, the CRA and ISO/IEC 27001:2022, with 125 cross-framework satisfaction pairs and Drizzle-compatible Postgres schemas. **MIT**, so it carries none of the AGPL obligations the application does.

| Entry point | Contents |
|---|---|
| `@nisd2/grc-data-model` | everything below, re-exported |
| `/frameworks` | categories and requirements per framework |
| `/schema` | Drizzle table definitions: framework, requirement, asset, supplier, risk, incident |
| `/satisfaction-pairs` | the cross-framework pairs |
| `/mappings/nis2-gdpr` | the NIS 2 to GDPR mapping on its own |
| `/enums` | shared enumerations |
| `/seed` | the seeding helpers |

```ts
import {
  nis2Categories,
  getNis2RequirementsForCategory,
} from "@nisd2/grc-data-model/frameworks";
import { complianceFramework, requirement } from "@nisd2/grc-data-model/schema";

for (const category of nis2Categories) {
  const requirements = getNis2RequirementsForCategory(category.slug);
  console.log(category.code, requirements.length);
}
```

Requirements are built through a factory, so each call returns a fresh object you can mutate without corrupting the shared catalogue.

## @nisd2/incident-notification-schema

The NIS 2 Article 23 incident notification format as a typed Zod schema, with the reference data and Drizzle tables alongside it. Dual-licensed: **AGPL-3.0 or a commercial licence**, so read `LICENSE` before you embed it in something closed.

| Entry point | Contents |
|---|---|
| `/schema` | Zod schemas for the notification stages |
| `/data` | reference data |
| `/db` | Drizzle tables |

Useful on its own if you are building anything that has to produce or consume an early warning, an incident notification or a final report in a shape a competent authority will recognise.

## @nisd2/nis2-supply-chain-questionnaire-schema

The questions a regulated entity asks its suppliers, as Zod and as JSON Schema. Same dual licence as above.

```ts
import questionnaire from "@nisd2/nis2-supply-chain-questionnaire-schema/data/supply-chain-questionnaire.json";
```

The JSON Schema file is exported directly, so a consumer in another language can validate against it without touching TypeScript.

## Versioning

Each package is versioned and released independently of the platform image. The version in this repository can be ahead of what is on npm: publication is a deliberate step in the release pipeline rather than an automatic consequence of merging. Check npm for what is actually available.

Two schema packages are also mirrored as standalone repositories under [github.com/NISD2](https://github.com/NISD2) for tag-pinning. The copies in this repository are the source of truth.

## Workspace-only packages

`@nisd2/isms-schema`, `isms-ui`, `isms-pages`, `isms-lib`, `isms-trpc` and `isms-messages` are consumed through bun workspaces and are not on npm. They are AGPL-3.0-or-later, and their interfaces change with the application, so depending on them from outside this repository is not something to rely on yet.
