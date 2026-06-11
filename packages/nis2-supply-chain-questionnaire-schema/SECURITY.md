# Security policy

## Supported versions

The latest tagged release on `main` is the only supported version. Older versions remain reachable via git tags but receive no patches.

## Reporting a vulnerability

This repository ships a Zod schema, a JSON artefact, and small helper functions. There is no runtime, no network handler, no authentication code, and no user-input parsing beyond Zod's own validation. The realistic vulnerability surface is:

- A schema flaw that lets crafted input bypass validation
- A regex denial-of-service (ReDoS) in one of the schema patterns
- A supply-chain compromise of `zod` (our only runtime dependency)

If you find one of these, please email **contact@nisd2.eu** with a subject line starting `[security]`. Include:

- A short description of the issue
- A minimal reproduction
- Your assessment of impact

We respond within 5 working days. If the issue is confirmed, we publish a patch release and a security advisory on this repository.

For non-security bugs, open a normal issue.

## Maintainers

- Kardashev Catalyst UG (haftungsbeschränkt) — operator of nisd2.eu
- Primary contact: contact@nisd2.eu
