# NIS 2 Incident Notification Schema

Open EU data format for Article 23 NIS 2 incident notifications. A typed
Zod schema and TypeScript helpers anchored to the directive, the
implementing regulation, ENISA's technical guidance, the NIS Cooperation
Group common templates (adopted 26 May 2026), and the W3C DPV NIS 2
vocabulary.

National portal field mappings (BSI Meldeportal, ANSSI, NCSC-NL, ACN,
INCIBE-CERT, ...) live as a downstream extension layer per field — the
schema itself stays EU-neutral.

## Why this exists

When a significant cyber incident hits an entity in scope of NIS 2, the
clock starts: 24 hours to send an early warning, 72 hours for the
notification, one month for the final report. The data fields that
need to be collected are largely the same across the EU, but each
Member State runs its own portal with its own field names.

Until the Cooperation Group's common templates (adopted at the 39th
Plenary, Nicosia, 26 May 2026) are formalised via a Commission
Implementing Regulation, and until the proposed Single Entry Point
(Article 23a, Digital Omnibus 19 November 2025) goes live, there is no
public machine-readable schema for these fields. This repository fills
that gap.

## EU instruments anchored

- Directive (EU) 2022/2555 — NIS 2, Art. 23
- Commission Implementing Regulation (EU) 2024/2690 — significance
  thresholds for the digital-service-provider categories it covers
- ENISA Technical Implementation Guidance v1.0 (June 2025)
- NIS Cooperation Group Common Notification Templates (adopted 26 May
  2026; Commission Implementing Regulation pending)
- W3C DPV NIS 2 Vocabulary v2.3 (25 February 2026) — semantic alignment

## Report types

Five report types, each carrying a W3C DPV persistent URI:

| Constant | DPV URI | Trigger |
|---|---|---|
| `earlyWarning` | `EarlyWarningReport` | within 24 h of awareness |
| `incidentNotification` | `IncidentAssessmentReport` | within 72 h |
| `intermediate` | `IntermediateReport` | upon CSIRT request |
| `progress` | `ProgressReport` | within 1 month if incomplete |
| `final` | `FinalReport` | within 1 month of completion |

The Article 23(2) customer notification ("RiskMitigationAdvice" in DPV)
is carried as fields on the report types rather than a separate report.

## Install

```sh
npm install @nisd2/incident-notification-schema
```

```sh
pnpm add @nisd2/incident-notification-schema
```

```sh
bun add @nisd2/incident-notification-schema
```

## Usage

```ts
import {
  incidentNotificationSchema,
  fieldsRequiredFor,
  REPORT_TYPE,
} from "@nisd2/incident-notification-schema";

// What does an Early Warning need at minimum?
const required = fieldsRequiredFor(REPORT_TYPE.EARLY_WARNING);

// Iterate the field metadata to render your own form, PDF, or portal
// integration:
for (const field of required) {
  console.log(field.id, field.label.en, field.legalBasis[0].citation);
}
```

## Validate a submission

```ts
import {
  incidentSubmissionSchema,
  REPORT_TYPE,
} from "@nisd2/incident-notification-schema";

const parsed = incidentSubmissionSchema.parse({
  reportType: REPORT_TYPE.EARLY_WARNING,
  schemaVersion: "0.1.0",
  values: {
    incidentSummary: "Ransomware on billing servers, isolated 2026-06-01T13:42Z",
    suspectedUnlawfulOrMalicious: "suspected",
    hasCrossBorderImpact: false,
    incidentDetectedAt: "2026-06-01T13:18:00Z",
    reporterName: "M. Müller",
    reporterEmail: "csirt-contact@example.eu",
  },
});
```

## National portal mappings

The schema is EU-neutral. Each field's `nationalPortalMappings` array
records which national portal screen + field name corresponds to that
EU field.

Today the DE (BSI Meldeportal) layer is populated. Other Member State
mappings are placeholder slots — contributions welcome via pull
request. The mapping content is dual-licensed (see LICENSE).

## Cross-regulation overlap

Most security incidents trigger more than one EU reporting regime —
NIS 2 + GDPR for personal-data incidents, NIS 2 + DORA for financial
sector, NIS 2 + CER for physical incidents at critical entities, NIS 2
+ eIDAS for trust services. Each field carries `crossRegulationOverlaps`
pointing to the equivalent field in the other regime, so a single
internal data collection can be replayed against multiple downstream
submissions.

## Versioning

Semver. v0.x is pre-stable while the Cooperation Group's common
templates publish through the Commission Implementing Regulation
process and as we collect feedback from the first national portal
mappings. v1.0 ships once the Implementing Regulation is final.

## Licence

Dual: CC BY 4.0 for the content (field definitions, citations,
mappings) and MIT for the code (Zod schema, TypeScript helpers). See
`LICENSE`.

## Contributing

The maintainer's view: this is a public dataset that becomes more
useful with every new national portal mapping added. PRs welcome,
especially for FR ANSSI, NL NCSC, IT ACN, ES INCIBE-CERT mappings.
File issues for anything that does not align with primary sources.

## Status — not legal advice

The schema reflects our reading of the directive, the implementing
regulation, ENISA guidance, the W3C DPV vocabulary, and the BSI
Meldeportal field list as of June 2026. It is not legal advice. Each
entity is responsible for ensuring its actual notification meets the
applicable national authority's requirements.

## Maintainer

Maintained by [Simon Orzel](https://www.nisd2.eu/impressum) for [nisd2.eu](https://www.nisd2.eu) — a free EU NIS 2 compliance platform. Contact: [contact@nisd2.eu](mailto:contact@nisd2.eu).
