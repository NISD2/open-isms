Framework content is data, not code. It lives in [`@nisd2/grc-data-model`](/docs/packages/npm-packages), is published to npm on its own, and reaches a running instance through migrations rather than through a seed you re-run.

## What ships

| Framework | Categories | Requirements |
|---|---|---|
| NIS 2, Directive (EU) 2022/2555 | 12 | 49 |
| GDPR | 6 | 9 |
| EU AI Act | 10 | 24 |
| Cyber Resilience Act | 10 | 21 |
| ISO/IEC 27001:2022 | 5 | 116 |

219 requirements in total. A CI check regenerates the reference table from the data on every push and fails if the counts drift, so the numbers on this page cannot quietly stop being true.

NIS 2 is the primary framework: it is the one the seed activates, and the one the portal surfaces by default. The others are there for organisations already carrying those obligations, and for the crosswalk below.

## The shape of a requirement

Each requirement carries the article it comes from, the reference URL for that article, a national transposition link where one exists, an estimated effort, the roles it concerns, and, for NIS 2, a mapping to the relevant IT-Grundschutz module.

Categories group them. NIS 2's twelve run from Governance through to Supply chain, each with its own reference into the Directive and into the revised BSIG.

```ts
import {
  nis2Categories,
  getNis2RequirementsForCategory,
} from "@nisd2/grc-data-model/frameworks";

const governance = nis2Categories.find((c) => c.code === "GOV");
const requirements = getNis2RequirementsForCategory("governance");
```

## Cross-framework satisfaction

125 pairs record where evidence for one requirement genuinely answers another, each with the sentence explaining why.

| Pair | Count |
|---|---|
| ISO 27001 to NIS 2 | 87 |
| NIS 2 to GDPR | 11 |
| CRA to NIS 2 | 9 |
| EU AI Act to NIS 2 | 7 |
| EU AI Act to GDPR | 5 |
| CRA to EU AI Act | 4 |
| CRA to GDPR | 2 |

The point is not to claim that one certificate satisfies another regulation. It is that an organisation with an ISO 27001 management system has already done most of the work NIS 2 asks for, and should be shown that rather than asked to start again. Each pair names the overlap precisely, and several are explicit about their limits. The CRA to AI Act pair, for instance, records that Article 12 grants presumption of conformity with AI Act Article 15 only, and does not reach the Article 9 risk-management system.

## Where the legal text is not

These pages document the software. The subject-matter reference, including sector applicability, national transposition status, the Implementing Regulation and registration procedure, lives on [the nisd2.eu wiki](https://www.nisd2.eu/wiki), in German and nine other languages. That is a different audience and a different job.
