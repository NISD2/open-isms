# Security policy

## Scope

`@nisd2/grc-data-model` ships TypeScript schema definitions, framework data, and cross-framework mappings. It does not perform authentication, authorization, network I/O, file I/O, or any privileged action. Security issues in this package are limited to:

- **Data integrity** — incorrect mappings or legal references that could lead a consumer to mis-attest compliance
- **Type-safety holes** — schema definitions that allow invalid PostgreSQL values to flow through Drizzle's type system

## Reporting

For security issues, email **contact@nisd2.eu** with the subject line `security: grc-data-model`. Please include:

- A description of the issue
- Reproduction steps (if applicable) or a citation to a primary source contradicting our data
- Whether you've coordinated with any consumers of the package

We aim to respond within 5 business days.

For non-security data corrections (e.g. a requirement code citing the wrong article number), please open a GitHub issue instead.

## Disclosure

We follow responsible-disclosure norms. If a fix is non-trivial we'll request a private window before public disclosure. Reporters are credited in the CHANGELOG unless they request anonymity.

## Out of scope

- Vulnerabilities in `drizzle-orm` (the only runtime dependency) — please report those upstream.
- Vulnerabilities in the consuming app at [nisd2.eu](https://www.nisd2.eu) — please email the same address with the subject line `security: nisd2.eu`.
