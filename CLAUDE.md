# CLAUDE.md — NIS2 Compliance Platform

## Quick Reference

```bash
bun install              # Install dependencies (ALWAYS use bun, never npm/yarn)
bun run dev              # Dev server on port 3026 (webpack, not turbopack)
bun run typecheck        # tsc --noEmit — must pass with ZERO errors
bun run build            # Production build — must pass clean
bun db:generate          # Generate Drizzle migration after schema changes
bun db:migrate           # Apply migrations
bun db:seed              # Seed database (drops + recreates dev data)
```

## Hard Rules

- **Zero type errors** — always verify with `bun run typecheck` before finishing work
- **No `as any` casts** — use proper types, generics, or type narrowing
- **No non-null assertions (`!`)** — use explicit null checks, early returns, or narrowing. If a value is guaranteed non-null by prior logic, add a runtime check
- **NEVER `drizzle-kit push`** — ALWAYS `bun db:generate` then `bun db:migrate`. Push bypasses migration tracking and causes DB state drift. No exceptions.
- **No "wizard" or "demo"** in route names or visible UI
- **KISS** — don't over-engineer. Simple > clever. 3 similar lines > premature abstraction
- **Turbopack is the default for `next build` since 16.2** — the prior "Webpack required" rule (TW v4 PostCSS conflict) was fixed mid-16.x. `bun run build` uses Turbopack; `bun run build:webpack` is the escape hatch. Dev still uses webpack via `bun run dev` (HMR is steadier today); `bun run dev:turbo` is opt-in.
- **Bun only** — package manager is bun, not npm or yarn

## Tech Stack

| Layer | Tech | Version | Notes |
|-------|------|---------|-------|
| Framework | Next.js | 16.1.6 | App Router, SSR-first |
| React | React | 19.1.0 | `useOptimistic`, `useTransition` available |
| TypeScript | TS | 5.7.3 | Strict mode |
| Styling | Tailwind CSS | 4.1.0 | `@theme inline` for shadcn color vars |
| Validation | Zod | **4.x** | NOT v3. Uses `_def.type` not `_def.typeName` |
| ORM | Drizzle | 0.38.3 | PostgreSQL, relational queries |
| API | tRPC | 11.1.0 | superjson transformer |
| Auth | NextAuth | 5.0.0-beta.30 | JWT strategy, Google OAuth |
| i18n | next-intl | 4.8.2 | Cookie-based locale, EN default + DE |
| AI | Vercel AI SDK | 6.x | + @ai-sdk/xai (grok-2-1212) for form prefill |
| Storage | AWS S3 | SDK v3 | Presigned URLs for evidence uploads |
| Email | Resend | — | Transactional email delivery |

## Architecture

### SSR-First Pattern
Server components fetch data via `api` (tRPC server caller), pass serializable props to client components. Client components use `"use client"` directive.

```
Server Page → api.router.procedure() → Client Component (props)
```

After mutations: `router.refresh()` re-fetches server component data.

### Unified Form Pipeline
ALL compliance requirement forms use the same pipeline. No hand-built forms:

```
DB requirement_form_field → buildDynamicSchema() → SchemaForm → shadcn components
```

File-type fields automatically render the `FileUpload` component (S3 presigned URL upload).

### tRPC Procedures
- `publicProcedure` — no auth
- `protectedProcedure` — requires `ctx.userId`, auto-logs all mutations to audit trail
- `adminProcedure` — requires role === "admin"
- `reviewerProcedure` — requires role in ["admin", "reviewer", "legal_reviewer"]

Auto-audit middleware extracts entity ID from input (checks: id, statusId, evidenceId, etc.) and logs after mutation completes (fire-and-forget).

### Auth
- **Dev**: auto-injects seed user via `lib/auth/dev-user.ts`
- **Prod**: Google OAuth, middleware redirects to `/auth/signin`
- Session: `getSession()` from `lib/auth`

### Database
- PostgreSQL via `DATABASE_URL` env var
- **GRC-core schema lives in `@nisd2/grc-data-model`** (workspace package at `packages/grc-data-model/`, mirrored to `github.com/NISD2/grc-data-model` via `git subtree push`)
  - Drizzle tables: `framework`, `requirement`, `requirement-satisfaction`, `supplier`, `asset`, `risk`, `incident`
  - GRC enums (16): framework, entity_type, evidence_type, frequency, priority, etc.
  - Framework data: NIS2 (12 cats / 49 reqs) + GDPR (5 / 7), satisfaction pairs
- **App-only schema** in `schema/`:
  - `schema/tables/*.ts` — auth, billing, audit-log, notification, evidence, policies, leads, supplier-portal, training, etc.
  - `schema/enums.ts` — app-specific enums (plan, lead_intent, ai_data_sharing, notification_status, operational-table enums)
  - `schema/modules/**/*.ts` — framework-specific extensions (e.g. BSIG)
  - `schema/relations.ts` — Drizzle relations across both package and app tables (centralized)
  - `schema/types.ts` — inferred TypeScript types
  - `schema/index.ts` — single import point: re-exports package + app schema
- `drizzle.config.ts` schema array reads from both package and app paths
- Migrations live in app `drizzle/*.sql` (single source of truth)
- Seed: `drizzle/seed.ts` imports framework data from `@nisd2/grc-data-model/frameworks`

### i18n
- **3 locales:** `de` (default), `en`, `nl`. Configured in `i18n/routing.ts`.
- **`[locale]` route segment** at the top of `app/[locale]/...`. All pages live under it.
- **`localePrefix: "as-needed"`** — default locale (DE) has no prefix (`/nis2-bussgelder`); other locales get a prefix (`/en/nis2-fines`, `/nl/nis2-boetes`).
- **Locale detection:** cookie-based (`locale` cookie) plus `Accept-Language` header.
- **Translations** live in `messages/{namespace}/{de,en,nl}.json`. ~29 namespaces.
- Use `useTranslations("namespace")` in client components.
- Use `getTranslations("namespace")` in server components.

### Localized pathnames — current state vs target
- **Current state:** locale-prefix only. `routing.ts` does NOT define `pathnames`. URL slugs are identical across locales (`/nis2-bussgelder`, `/en/nis2-bussgelder`, `/nl/nis2-bussgelder`). This is the inconsistency we want to fix.
- **Target state:** localized URL slugs per locale via `pathnames` in `routing.ts`. E.g. DE `/nis2-bussgelder`, EN `/en/nis2-fines`, NL `/nl/nis2-boetes`.
- **Why not yet implemented:** strict pathnames typing in next-intl turns `Link href` into a literal-union type. Existing dynamic routes (`/compliance/[categorySlug]`, `/training/courses/[courseId]/[lessonId]`) and query/hash variants (`/auth/signin?callbackUrl=...`, `/compliance/${slug}#anchor`) require refactoring 30+ Link usages to the object form `<Link href={{ pathname: ..., params: ... }}>`. Multi-day effort.
- **When implementing:**
  - Add `pathnames` map to `routing.ts` covering all Tier 1/2 routes; keep existing URLs as the DE entries (additive, no DE traffic lost).
  - Refactor every dynamic-segment Link to the object form before adding the pathnames map. Otherwise typecheck explodes.
  - Update `app/sitemap.ts` to emit all locale variants of every public route.
  - Add 301 redirects in `next.config.ts` for any legacy locale-prefix URLs that change (e.g. `/en/nis2-bussgelder` → `/en/nis2-fines`).
- **Token-based routes** (`/invite/[token]`, `/supplier-access/[token]`, `/supplier-invite/[token]`) NEVER need localized pathnames — auto-generated, single-use, never indexed.

## File Structure

```
app/[locale]/          # All public + portal routes nested under [locale] segment
  (info)/              # 48 public-facing info / SEO pages
  (portal)/            # 25 logged-in portal feature routes (dashboard, compliance, risks, etc.)
  (platform-admin)/    # Admin-only pages
  applicability/       # Public applicability check
  auth/signin/         # Sign-in page
  onboarding/          # Post-signup onboarding
  start/               # Funnel landing
  supplier-portal/     # Public supplier-portal entry
  portal/supplier/     # Authenticated supplier portal pages
  training/            # Course pages (logged in)
  invite/[token]/      # Token-based, NOT localized
i18n/                  # next-intl config: routing.ts (pathnames map), navigation.ts, request.ts
app/api/               # API routes (auth, trpc, cron, export) — NOT under [locale]
app/sitemap.ts         # Sitemap generator — must emit all locale variants of public routes
components/            # React components organized by feature
lib/
  auth/                # NextAuth config, session, dev user
  compliance/          # Deadline math, escalation, scheduling, webhooks
  forms/               # SchemaForm, field renderer, Zod introspection
  mail/                # Email templates (Resend)
  storage/             # S3 client, presigned URLs
  audit/               # Audit logging (logAudit)
  db.ts                # Drizzle instance + Database type
  utils.ts             # cn(), getAppUrl()
schema/
  enums.ts             # 30+ PostgreSQL enums
  tables/              # 31 table definitions
  modules/             # Framework-specific extensions (BSIG)
  relations.ts         # Drizzle relational query definitions
  index.ts             # Barrel export
server/trpc/
  init.ts              # Context, procedures, auto-audit middleware
  router.ts            # Root router
  routers/             # 24 feature routers
drizzle/
  seed.ts              # Database seeding
  *.sql                # Generated migrations
messages/              # i18n JSON files per namespace per locale
[redacted for public release]
[redacted for public release]
```

## Code Principles

1. **Solid composable clean code** — isolate functionality cleanly into modules
2. **SSR-first** — fetch on server, render on client. Minimize client-side fetching
3. **Type safety end-to-end** — Drizzle → drizzle-zod → Zod → tRPC → React. No gaps
4. **Audit everything** — every mutation is logged. Notifications use status lifecycle (pending → sent → acknowledged), never deleted
5. **Fire-and-forget for non-critical work** — email sending, notification scheduling use `.catch(() => {})` pattern
6. **Company-scoped queries** — always filter by `ctx.companyId` in tRPC procedures
7. **i18n all user-facing strings** — no hardcoded English in components

## Voice & Copy Rules (shared with NIS2 private notebook)

These apply to any user-facing copy in either repo: marketing pages, wiki, course content, i18n strings (this open-isms platform) AND LinkedIn posts, outreach drafts, sales scripts (NIS2 private notebook). Same rules, same standards. The platform's voice should be consistent across LinkedIn → marketing pages → wiki → in-app strings, so the same rules apply on both sides of the repo split.

- **No emojis.** Audience is CISOs, lawyers, Geschäftsführer. Emojis undermine professional register.
- **No em-dashes.** They read as AI-generated. Use periods, commas, colons, or parens.
- **No fear-based marketing.** Don't lead with fines, personal-liability scare, breach loss numbers, insurance threat. Lead with debunking, clarification, observation, or helpful-tactical.
- **No "no login" framing.** The platform requires sign-up. Use "Kostenlos" / "Open Source" / "Kein Lock-in" instead.
- **No hyphenated German compounds.** Prefer single-word compounds (Hochrisikopflichten, Selbsteinstufungen) or restructured phrasing ("Anwendungen im Anhang III") over hyphen chains. Hyphen-heavy German reads as Denglish or AI-generated.
- **No fake numbers.** Every threshold, deadline, fine, statistic is backed by a primary source.
- **EU-wide English terminology as primary.** RoPA, DPA, DPIA, DPO, TOMs, and EU regulation article numbers. National transpositions (BSIG, BDSG, TDDDG, NIS2UmsuCG) appear as transposition examples, never primary citations.
- **Mittelstand-operator register for German content.** Between consumer and specialist. Article numbers stay, surrounding language is plain. Test: a GmbH-Geschäftsführer skims and knows the next step.
- **DE primary, EN secondary** for user-facing copy. NL follows EN. Always check translations side-by-side for tone and nuance.
- **Factcheck against primary sources.** EUR-Lex, gesetze-im-internet, BSI, ENISA. Verify every article number, threshold, and quote before shipping.
- **No Claude attribution on git commits.** Never add `Co-Authored-By: Claude` lines to any commit in either repo.

If a copy choice fails one of these, fix it before shipping.

## Common Patterns

### Adding a new tRPC router
1. Create `server/trpc/routers/my-feature.ts`
2. Use `protectedProcedure` (or `adminProcedure` for admin-only)
3. Register in `server/trpc/router.ts`
4. Query from server page: `const data = await api.myFeature.list()`

### Adding a schema table
1. Decide where it lives:
   - **GRC-domain (used by any ISMS consumer)** → `packages/grc-data-model/src/schema/my-table.ts`
   - **App-only (auth, billing, app feature)** → `schema/tables/my-table.ts`
2. Create the file with `pgTable(...)`
3. Add relations in `schema/relations.ts` (centralized for both package and app tables)
4. App: re-export from `schema/index.ts`. Package: add to `src/schema/index.ts`
5. Run `bun db:generate && bun db:migrate` (always from monorepo root — drizzle.config reads both sources)
6. Update `drizzle/seed.ts` if seed data is needed
7. If the package changed and you want to mirror to the OSS repo: `bash scripts/push-grc-data-model.sh` (force-pushes the cleaned subtree, strips AI co-author lines from commit messages, owns the OSS repo's history; replaces the raw `git subtree push` workflow)

### Adding i18n strings
1. Add to `messages/{namespace}/de.json`
2. Add to `messages/{namespace}/en.json`
3. Add to `messages/{namespace}/nl.json`
4. Use `useTranslations("namespace")` (client) or `getTranslations("namespace")` (server)

### Adding a new public page (info / pre-login)
1. Create `app/[locale]/(info)/my-page/page.tsx` (server component) — DE slug under the directory name
2. Create `components/my-page/MyPageComponent.tsx` (client component)
3. Fetch data in server page via `api`, pass as props to client component
4. **Register the route in `i18n/routing.ts` `pathnames`:**
   ```ts
   "/my-page": {
     de: "/mein-pfad",
     en: "/my-page",
     nl: "/mijn-pad",
   }
   ```
5. **All `<Link href="...">` references use the canonical (EN) path**, NOT the localized URL.
6. Add page to `app/sitemap.ts` so all 3 locale variants get indexed.
7. Add nav links via the appropriate hub index page (Diagnostik / Referenz / Umsetzung / Werkzeuge), not directly to the footer.

### Adding a new portal page (logged-in)
1. Create `app/[locale]/(portal)/my-page/page.tsx` (server component)
2. Create `components/my-page/MyPageComponent.tsx` (client component)
3. Fetch data in server page via `api`, pass as props to client component
4. Register localized pathname in `i18n/routing.ts` (lower SEO priority but still required for consistency)
5. Add sidebar link in `components/portal/AppSidebar.tsx`


## Public-repo hygiene

This is the public OSS platform (AGPL-3.0). Some kinds of content do not belong in this repo regardless of how convenient it would be to write them here:

### Never commit

- **Lead lists, named prospects, outreach drafts** referencing real people or companies
- **Sales material, persona research, social-post drafts** for specific recipients
- **Financial plans, revenue projections, payroll info, IHK or grant correspondence**
- **Internal strategy docs** with specific competitive analysis, customer references, or positioning calls
- **Meeting transcripts** with named participants
- **Personal info** beyond what's necessary for the platform (CV, personal signature HTML, etc.)
- **Hardcoded admin/recipient emails** — use the `PLATFORM_ADMIN_EMAILS` env var
- **Hardcoded support emails** — use the `SUPPORT_EMAIL` env var
- **`.env*` files** (already gitignored — confirm before commits)
- **Secrets of any shape** (`*.pem`, `*.key`, `**/credentials.json`, `**/service-account*.json`)

If you find yourself wanting to write any of the above: it belongs in a **separate, private repo**. Maintainers of nisd2.eu keep one for their business / sales / strategy notes. External contributors don't need to touch that side — your work happens entirely in this repo.

### Public history is forever

Any sensitive content committed and pushed lives in git history globally, even after a follow-up delete commit. There is no recovery. Treat every commit as if it will be on Hacker News tomorrow.

### Layer rules

- App code goes in `app/`, `lib/`, `components/`, `schema/`, `server/`, `drizzle/`.
- Reusable schema / framework data goes in `packages/grc-data-model/`, `packages/incident-notification-schema/`.
- Internal-shared workspace packages go in `packages/isms-*/`.
- Reference app (Docker-composed demo) lives in `apps/reference/`.
- The above categories are the only places code should live. Don't add a top-level `business/`, `sales/`, `strategy/`, or `internal/` directory.


## Knowledge sources for AI assistants

When answering substantive questions about NIS 2 / GDPR / EU AI Act / CRA / ISO 27001, treat these as authoritative. Read from them; do NOT generate from training-data memory.

### Framework + legal facts (in-repo, canonical)

- `packages/grc-data-model/src/frameworks/` — article-level data per framework. NIS 2 has 49 requirements across 12 categories with EUR-Lex references and BSIG transposition links. GDPR has 7 articles. Same for EU AI Act, CRA, ISO 27001:2022.
- `packages/grc-data-model/src/schema/` — Drizzle table definitions for framework, requirement, asset, supplier, risk, incident
- `packages/grc-data-model/src/mappings/` — cross-framework mappings (NIS 2 ↔ GDPR)
- `packages/incident-notification-schema/` — NIS 2 §23(4) incident notification format: structured fields, severity, timing windows, IoC reporting
- `app/[locale]/wiki/` — the public wiki on nisd2.eu. Sector-specific applicability, BSIG section walk-throughs, CIR 2024/2690 article-by-article, member-state status, implementation guides, troubleshooting. Hundreds of pages. **Canonical for "what does nisd2.eu say about X."**
- `data/*.json` — registration portals per EU member state, NIS 2 timeline, reference data
- `courses/nis2-ceo/`, `nis2-tabletop/`, `cra-sbom/` — pedagogical content; same facts as the wiki but explained for management training

### External truth repos (consumed as deps)

- `@nisd2/nis2-gap-assessment-schema` (github.com/NISD2/nis2-gap-assessment-schema, version-pinned)
- `@nisd2/nis2-supply-chain-questionnaire-schema` (same)
- `@nisd2/grc-data-model` (mirror of `packages/grc-data-model/` for standalone npm consumption; the in-repo copy is source of truth)
- `@nisd2/incident-notification-schema` (mirror of `packages/incident-notification-schema/`)

### Rule of thumb

- Article number, threshold, deadline, member-state status → check `packages/grc-data-model/frameworks/`, the wiki, or `data/*.json`. Don't paraphrase from memory; the canonical text often has a footnote or nuance that matters.
- Sector applicability question → `app/[locale]/wiki/anwendungsbereich/` has a dedicated page per sector.
- "Are we storing this correctly?" → `packages/isms-schema/src/tables/` for the operational columns and `packages/grc-data-model/src/schema/` for the entity model.
- Incident structure → `packages/incident-notification-schema/`.
