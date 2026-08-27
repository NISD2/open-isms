# Contributing to NISD2

Thanks for your interest. This project is built and maintained by a small team; external contributions are very welcome.

## What we're looking for

Particularly valuable:

- **New / corrected framework data** — articles in `packages/grc-data-model/src/frameworks/`. NIS 2, GDPR, EU AI Act, CRA, ISO 27001 mappings.
- **Schema improvements** — `packages/isms-schema/src/tables/`. Especially around process tracking edge cases (sign-off chains, evidence types, audit-log retention).
- **Translation** — DE/EN/NL catalogs in `messages/` and `packages/isms-messages/`.
- **Documentation** — `docs/` for deployment, legal references, requirement walkthroughs.
- **Bug reports** — open a GitHub issue with a minimal reproduction, the affected file paths, and the relevant version (commit SHA or release tag).

## Dev setup

```bash
git clone https://github.com/NISD2/open-isms.git
cd open-isms
bun install                         # Bun 1.3+
bun run typecheck                   # must pass clean
bun run build                       # full Next.js build
bun run dev                         # http://localhost:3026
```

The Drizzle migration chain runs against a local Postgres (see `docs/coolify-deployment.md` for details), but most contributions don't need the DB running.

## Conventions

- **TypeScript strict mode** — no `as any`, no non-null assertions (`!`). Use explicit checks or narrowing.
- **Bun-only** — no `npm`, `yarn`, `pnpm` in commits.
- **No `drizzle-kit push`** — always `bun db:generate` then `bun db:migrate`.
- **No emojis** in code or commit messages.
- **No em-dashes** in user-facing copy (reads as AI-generated).
- **Conventional-style commits**: `feat(area):`, `fix(area):`, `docs:`, `refactor:`, `chore:`. Past tense optional.
- **No Claude / AI co-author lines** in commit messages.

## PR flow

1. Fork → branch → commit → PR
2. CI runs typecheck + build + test. PRs need green CI to merge.
3. For schema or framework data changes: include a brief justification of the source (the relevant Article / paragraph / standard clause).
4. Maintainers review and merge; squash-merge is the default.

## Releases

Releases are a deliberate step, and still need nothing run locally. Go to Actions, run the **Release** workflow, and it works out the next version itself, builds both architectures, proves the image installs and upgrades into the previous release, then moves `stable`, tags the commit and writes the release notes. Tick `dry_run` to build both architectures and publish nothing.

It does not fire on merge. A version here is something a stranger installs onto a database holding their compliance evidence, so it is worth choosing when that happens rather than releasing whatever main happens to be.

npm packages are separate and also on demand: run the **Publish npm packages** workflow with the version you want.

## Code of conduct

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md). Be kind. We assume good faith.

## License

By contributing, you agree your contributions are licensed under [AGPL-3.0-or-later](../LICENSE) for the app and workspace-only packages, and under each package's individual license (MIT for `grc-data-model`, dual-AGPL for `incident-notification-schema`).
