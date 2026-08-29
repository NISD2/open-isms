The frameworks, their categories, the 165 requirements a seeded instance holds and the cross-framework satisfaction pairs are reference data: the same rows on every instance, shipped with the software rather than created by you.

Since version 0.2.9 this happens by itself. The container applies its migrations at startup, then checks whether the requirement catalogue is empty, and fills it from `db/framework-seed.sql` inside the image if it is:

```text
[migrate] all chains complete
[seed] empty catalogue — loading db/framework-seed.sql
[seed] loaded 165 requirements
```

On every later start the check finds the data and does nothing:

```text
[seed] framework data present (165 requirements)
```

That guard is what makes it safe. It runs only against an empty catalogue, so it can never overwrite an instance in use, and the file is upsert-only in any case: no deletes, and nothing that touches company data.

## What you get

| Framework | Categories | Requirements | Active |
|---|---|---|---|
| NIS 2 | 12 | 49 | yes |
| ISO/IEC 27001:2022 | 5 | 116 | no |

Plus 87 satisfaction pairs between them, each recording where ISO 27001 evidence answers a NIS 2 requirement and why.

ISO 27001 is inactive on purpose. It is loaded so those pairs resolve, and being inactive keeps it out of the sidebar, out of `/compliance` and out of what a new organisation is provisioned with. NIS 2 is the framework the product surfaces.

The data model carries five frameworks in total, 219 requirements including GDPR, the EU AI Act and the CRA. Only these two are seeded. The others are available through [the npm package](/docs/packages/npm-packages) and are not switched on in the product.

## If your instance is empty

The portal loading with no requirements in it means the seed has not run. That happens on versions before 0.2.9, and on any instance where the step was skipped.

Load it by hand. From the folder holding your `compose.yaml`:

```bash
curl -fsSLO https://raw.githubusercontent.com/NISD2/open-isms/main/db/framework-seed.sql
docker compose exec -T postgres psql -U openisms -d openisms < framework-seed.sql
```

Then check:

```bash
docker compose exec -T postgres psql -U openisms -d openisms \
  -tAc "select count(*) from requirement"
```

165 is the number to expect. The file is idempotent, so running it twice is harmless.

<div class="docs-callout">

Take the seed file from the release your image is running, not from `main`, if you have pinned an older version. The file writes into the schema its own release's migrations created. The copy inside the image is always the matching one:

```bash
docker compose exec -T app cat /app/db/framework-seed.sql \
  | docker compose exec -T postgres psql -U openisms -d openisms
```

</div>

## Updating framework content

You never re-run a seed for this. When a legal interpretation changes or a requirement is reworded, it ships as a migration in a release and reaches your instance at container start, like a code change.

Those updates are upserts keyed on `requirement.code`, which is why that code is a permanent identifier. It also means a locally edited requirement reverts on the next update: reference rows are overwritten unconditionally. Custom requirements need their own codes that this project will never issue. The reasoning is in [Migrations](/docs/contributing/migrations), rule 5.

## The developer seed is a different thing

`bun run drizzle/seed.ts` also exists. It is for a development machine: it writes the same reference data, adds the requirement prerequisites that gate working order, and creates a demo tenant called **Dev GmbH** with sample assets, risks and suppliers to click through.

Do not point it at a production instance. It clears before it writes, and its delete set comes from the global requirement catalogue rather than one tenant, so on a database with real data it removes evidence links, requirement assignments, statuses, category assignments and intake answers **for every company**, untransacted. It refuses any host other than localhost for that reason, which stops the accident but not an `ssh -L` tunnel that presents as one.

Self-hosting never needs it. See [Local development](/docs/contributing/local-development).
