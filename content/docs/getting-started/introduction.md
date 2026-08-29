open-isms is the platform behind [nisd2.eu](https://www.nisd2.eu). It is an information security management system: the place where an organisation records what it must do under the NIS 2 Directive, who owns each of those duties, when they are due, and what proves they were done.

Most compliance tooling treats evidence as a folder of PDFs you assemble the week before an audit. open-isms inverts that. Every requirement carries an owner, a deadline and a sign-off, so the assignments, the approvals and an append-only audit log become the evidence as you operate, rather than something reconstructed afterwards.

## What is in the box

Five regulatory frameworks ship as data, not as a marketing claim. The counts below come from `@nisd2/grc-data-model` and are asserted by a CI check on every push.

| Framework | Categories | Requirements |
|---|---|---|
| NIS 2 (Directive (EU) 2022/2555) | 12 | 49 |
| GDPR | 6 | 9 |
| EU AI Act | 10 | 24 |
| Cyber Resilience Act | 10 | 21 |
| ISO/IEC 27001:2022 | 5 | 116 |

That is 219 requirements, plus 125 cross-framework satisfaction pairs: places where evidence for one requirement genuinely answers another, each carrying the sentence that explains why. An ISO 27001 Clause 5.1 resourcing decision and the NIS 2 budget sign-off are the same act recorded twice, and the platform says so instead of asking you twice.

Around that data sits the operational half: asset inventory, risk assessment, supplier questionnaires and a supplier portal, incident records in the Article 23 notification format, policies, internal audits, management reviews, training with certificates, and the audit log underneath all of it.

## What it is not

- **Not a monitoring or detection product.** It records and evidences your management system. It does not watch your network, collect logs or raise alerts.
- **Not legal advice, and not a certification.** Article numbers and national transposition references are cited so you can check them. Whether a given measure is proportionate for your organisation is a decision you make and sign off.
- **Not a hosted-only product.** The image is public, the licence is AGPL-3.0, and a self-hosted instance has no licence key, no entitlement check and nothing phoning home.

## Two ways to run it

The hosted instance at [nisd2.eu](https://www.nisd2.eu) is the same software, operated for you. Self-hosting is the path when documents cannot leave your own infrastructure, which for public bodies, welfare organisations and many Mittelstand operators is a condition rather than a preference. These docs are written for the second case.

## How these docs are organised

**Getting started** is orientation and a ten-minute install. **Self-hosting** is everything needed to run an instance in production, one topic per page. **Platform** explains what the software models. **Packages** covers the schemas published on npm for use without the platform. **Contributing** is for working on open-isms itself.

Everything here is English only. The rest of the site is translated into ten languages because it is read by the people who must comply; these pages are read by whoever installs the software, and ten machine translations of a `docker compose` walkthrough would be ten more things to keep true.

## Licence

The application, scripts and workspace packages are [AGPL-3.0-or-later](https://github.com/NISD2/open-isms/blob/main/LICENSE). Running a modified copy as a network service obliges you to offer that modified source to its users. Running an unmodified copy for your own organisation obliges you to nothing.

Two published packages differ: `@nisd2/grc-data-model` is MIT, and `@nisd2/incident-notification-schema` is dual-licensed AGPL-3.0 plus commercial. See [npm packages](/docs/packages/npm-packages).
