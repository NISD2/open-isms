# Contributing to NISD2

Thanks for your interest. This project is built and maintained by a small team; external contributions are very welcome.

## What we're looking for

Particularly valuable:

- **New / corrected framework data** — articles in `packages/grc-data-model/src/frameworks/`. NIS 2, GDPR, EU AI Act, CRA, ISO 27001 mappings.
- **Schema improvements** — `packages/isms-schema/src/tables/`. Especially around process tracking edge cases (sign-off chains, evidence types, audit-log retention).
- **Translation** — DE/EN/NL catalogs in `messages/`.
- **Course corrections and new lessons** — lessons in `courses/<course>/content/<lesson>.<locale>.md`, quizzes in `courses/<course>/quizzes/`, glossary in `courses/<course>/dictionary.ts`. English is the source text: fix the `.en.md`, and change the German too or say in the PR that it needs the same fix. Other languages are refreshed from English with `scripts/i18n/translate-course.ts`, so a hand edit there may be overwritten. Every changed legal claim names its primary source (article, section, standard clause) in the PR.
- **Documentation** — `content/docs/` for everything published on nisd2.eu/docs (installation, self-hosting, contributing); `docs/` for migration policy, deployment notes and legal references.
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
- **No hand-written file over 5,000 tokens** (bytes / 4). `bun install` installs a pre-commit hook that refuses one, and CI checks the branch. A file already over the limit may shrink but not grow. The message says how to split the file; generated and vendored files are marked in `.gitattributes` and skipped.
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

## Running your own copy

You are welcome to, and the code in your copy is yours to change. If you change the code and let others use your copy over a network, section 13 of the AGPL requires you to offer those users your source.

We would rather have your fix in this repository. A pull request means your change ships to everyone, and you stop carrying a patch that has to be merged by hand with every release. If Git is not your workflow, a patch file or a zip by email to contact@nisd2.eu works too, and your name goes on the commit.

## Code of conduct

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md). Be kind. We assume good faith.

## License

By contributing to `courses/`, you agree your contribution is licensed under [CC BY 4.0](../courses/LICENSE), like the courses themselves. Your credit stays in the commit history.

By contributing anything else, you agree your contributions are licensed under [AGPL-3.0-or-later](../LICENSE) for the app and workspace-only packages, and under each package's individual license (MIT for `grc-data-model`, dual-AGPL for `incident-notification-schema`).
