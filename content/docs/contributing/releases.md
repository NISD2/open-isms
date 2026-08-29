Releasing is a decision, not a side effect of merging. There is nothing to run locally and no version to bump by hand.

Go to **Actions**, run the **Release** workflow. It works out the next version itself, builds both architectures, proves the image installs and upgrades into the previous release, and only then moves the tag everyone pulls.

Tick `dry_run` to build both architectures and publish nothing.

## Why not on merge

It used to fire on every push to `main`. That released a version per merge, and roughly half of them changed nothing that reaches the image: `.github` is in `.dockerignore`, so a workflow edit cannot alter the artifact, yet it still cost two native builds and a full upgrade gate.

Each version here is something a stranger installs deliberately onto a database holding their compliance evidence. "Whatever main happens to be" is a poor fit for that.

## What the pipeline does

1. **version.** The next patch after the newest released tag. Tags are written at the *end* of a successful run, so "newest tag" means "newest version that actually passed the gate", and a failed run never consumes a number.
2. **image.** One job per architecture, `linux/amd64` and `linux/arm64`, each on its own native runner rather than under QEMU emulation. Each pushes by digest.
3. **manifest.** The two digests become one multi-architecture manifest, so `docker pull` resolves the right one with no flags.
4. **upgrade-gate.** The published image is pulled without credentials, to prove it is actually public. Then: apply the previous release's migrations to a fresh database, fill it with realistic data including the shapes a careless constraint would reject, apply this release's migrations, check they are idempotent, and boot the image.
5. **promote.** `stable` and `latest` move to the new digest and are checked as pullable without credentials. The commit is tagged and the release notes are written.

The gate is the point of the whole thing. `stable` never moves to a version that has not survived an upgrade from the release before it, with dirty data in the database.

## npm packages

Separate, and also on demand: run the **Publish npm packages** workflow with the version you want.

That split is deliberate. Publishing used to gate the release pipeline, which meant a registry nobody had configured could hold `stable` hostage over a version mismatch in a package no self-hoster installs.

## Versioning in practice

The image is versioned linearly, and migration selection is by timestamp, so releases go out in a straight line. A fix for an older release is a new release from the tip, not a backport branch. See rule 7 in [Migrations](/docs/contributing/migrations).

Self-hosters track either `stable` or an exact version. What that means on their side is in [Updating](/docs/self-hosting/updating).

## When a release needs a compose change

Some releases need a new service or a new variable in `compose.yaml`, which lives on the self-hoster's server where we cannot update it. `COMPOSE_REVISION` records which revision they are running, and the app reports it at `/api/health`. Bump it in the example file and say so in the release notes.
