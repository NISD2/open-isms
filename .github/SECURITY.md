# Security policy

## Reporting a vulnerability

If you've found a security vulnerability in NISD2 — in the app, the schema packages, the reference deployment, or anywhere else — **please report it privately first**.

Email: **security@nisd2.eu**

Include:
- What the vulnerability is (a concise description)
- How to reproduce (step-by-step, ideally with curl or a code snippet)
- The affected file path or URL
- Impact assessment (data exposure? privilege escalation? denial of service?)
- Any suggested fix you have in mind

We acknowledge within **48 hours** and aim to address critical issues within **7 days**.

## What's in scope

- The app at `app/` and supporting `lib/`, `server/`, `schema/`
- The published packages (`@nisd2/grc-data-model`, `@nisd2/incident-notification-schema`)
- The workspace-only packages under `packages/`
- The reference deployment in `apps/reference/`
- The CI/release pipeline (`.github/workflows/`)
- The Drizzle migration chain (`drizzle/`, `packages/*/drizzle/`)

## What's out of scope

- The nisd2.eu hosted service operationally (uptime, performance) — these aren't vulnerabilities
- The marketing site copy
- Issues that require already-authenticated admin access to exploit (those are bugs, file as normal issues)
- Third-party dependencies — report to the relevant project (Next.js, Drizzle, Auth.js, etc.). We watch dependency advisories via Dependabot.

## Disclosure timeline

1. **Day 0**: report received
2. **Day 0-2**: acknowledged, triaged, severity assigned
3. **Day 2-7**: patch developed + reviewed
4. **Day 7-14**: patch released; if package-level, npm advisory published
5. **Day 14-30**: public disclosure on the GitHub Security tab

We'll coordinate with you on the disclosure timing. Critical vulnerabilities may get an accelerated track.

## Hall of fame

We credit reporters publicly after disclosure (with your permission). Add yourself by including your name + how you'd like to be credited in your report.

## What we do NOT do

- We don't run a paid bug bounty program (yet — when we do, this section gets updated).
- We don't ask reporters to sign NDAs.
- We don't threaten legal action against good-faith research.
