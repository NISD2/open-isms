# Implementation Plan: Generic Cross-Link Standard + Activation-Cliff Fix

This plan covers two independent workstreams in `open-isms`:

- **Part A** — a reusable architectural standard for two-way cross-linking between any two content nodes (course, journey, compliance requirement, wiki, tool, portal module), replacing today's three hand-rolled one-off links and two divergent scroll-to-element implementations.
- **Part B** — closing the activation cliff: users register but rarely begin the compliance journey, and onboarding friction is the suspected cause. Today the journey does not exist until a user completes a multi-step form wall, so the first authenticated experience for a new user is a "set up your organization" block rather than the product itself.

The two parts share no code and can ship in either order. Part A is low-risk and self-contained. Part B is higher-impact and touches auth, provisioning, gating, and admin metrics.

---

## Part A — Generic two-way cross-link standard

### Goal

Replace the bespoke, one-directional course-to-journey link (and the two divergent scroll-to-element copies) with a single declarative standard that:

1. Addresses any linkable node with a **type-safe** reference.
2. Declares cross-references **once** and derives both directions automatically.
3. Renders inline links (`<CrossLink>`) and "See also" blocks (`<RelatedLinks>`) generically.
4. Provides **one** reusable deep-link-to-node behaviour (scroll + transient highlight) via a hook + a DOM attribute convention, replacing the PathFlow-specific `useEffect` and the second copy in `ComplianceProgress`.
5. Migrates the just-merged course↔journey linking onto the standard with **no behaviour change**.

### Design

#### 1. Node addressing — a discriminated union, not a stringly id

The route catalogue is authoritative in `i18n/routing.ts`. Lesson ids are course-scoped and collide both across courses and with requirement codes (e.g. lesson `2.1` is not requirement `2.1`, per the comment in `lib/training/lesson-journey-map.ts:5-8`), so a node reference for a lesson **must** carry `courseId`. A flat `{type, id}` string cannot express composite ids safely. Define:

```ts
// lib/cross-link/node.ts
export type NodeRef =
  | { kind: "journey-category"; code: string }
  | { kind: "course-lesson"; courseId: string; lessonId: string };
```

Define **only the two kinds with a real consumer today**: `course-lesson` and `journey-category` (the just-merged course→journey link). Do not pre-enumerate `requirement`, `wiki`, `tool`, `portal-module` — none has a consumer yet, and a discriminated union is **extensible by construction**: adding a kind later is a localized change (one new union member plus one `resolveTarget` case), never a rewrite, so leaving them out costs nothing now. Add `wiki` when the wiki phase (Phase 6) lands; add `requirement`, `tool`, `portal-module` when a second/third real consumer appears. When the `tool` / `portal-module` kinds arrive, **derive** `ToolRoute` / `PortalModuleRoute` from the pathnames already declared in `i18n/routing.ts:54-277` (a typed subset of `keyof typeof pathnames`, e.g. `/risikobewertung`, `/strukturanalyse`, `/applicability`, `/risks`, `/incidents`, `/suppliers`) rather than re-listing the route literals by hand. Stable id sources: category `code`/`slug`/`sortOrder` from `@nisd2/grc-data-model` `nis2Categories` (`packages/grc-data-model/src/frameworks/nis2.ts:6-18`, also surfaced via `path-nodes.ts:153-166` `ORDERED_CATEGORIES`); requirement `code` from the same; wiki `slug` from `WikiTocEntry.slug`; lesson id from `courses/nis2-ceo/index.ts` `module.lessonIds`.

#### 2. Resolver — the single place that knows how a node becomes a URL + anchor + label

```ts
// lib/cross-link/resolve.ts
export function resolveTarget(ref: NodeRef, locale: Locale): {
  href: Href;        // next-intl typed object href
  anchorId: string;  // value stamped on data-cross-link-id at the destination
  labelKey: string;  // next-intl message KEY — resolved by the presentation layer, never a resolved string
};
```

`resolveTarget` is **pure, synchronous, and presentation-free**: it maps a `NodeRef` to a destination only. It returns a message *key*, not a localized string, so the inline link, the button shell, and the card shell each resolve copy with `useTranslations` / `getTranslations` while sharing one source of routing truth (see §4 — this is what lets the three presentations share destination logic without sharing a render tree).

Critical constraint: next-intl typed pathnames require **literal** pathname types per kind. Keep the per-kind `as const` pattern already used at `PathFlow.tsx:607-612` and `JourneyLink.tsx:25` (`href={{ pathname, params, query }}`). Do **not** widen the return to a generic `string` — that breaks `<Link>` type safety and would invite an `as any` (a CLAUDE.md violation). The resolver encodes the non-obvious destination rule:

- `journey-category` → `{ pathname: "/journey", query: { focus: code } }`. Note the **deliberate asymmetry**: `?focus` carries the *category* `code`, but the DOM anchor it must land on is `step-<requirementCode>`. The resolver maps the category to its **first requirement code** to produce `anchorId = step-<firstRequirementCode>`, bridging the category-level deep-link param and the requirement-level anchor. (Per-requirement precision — anchoring a specific requirement rather than its category's first node — is a future capability that arrives with the deferred `requirement` kind plus one extra resolver case, no rewrite.)

Labels collapse **four** sources into one, not three. There are four category-label sources today and they already disagree by copy: `nis2.ts` names, `path-nodes.ts:CATEGORY_NAME_DE`, `lesson-journey-map.ts:JOURNEY_CATEGORY_LABEL` (whose own comment at lines 60-66 admits it mirrors the others), **and** the next-intl `messages.compliance.categories` map (which the earlier draft missed). They have already drifted: `CATEGORY_NAME_DE.GOV` says "Governance" where `messages.compliance.categories.GOV.name` says "Governance & Haftung". This is load-bearing for the cross-link, because `CATEGORY_NAME_DE` feeds the **journey section headers** (`ORDERED_CATEGORIES.nameDe`, `path-nodes.ts:163`) that the `?focus` scroll actually lands on. If the resolver's label and the journey's section header read from different sources, the link text and the heading it scrolls to can disagree. To *legitimately* claim single-source, the resolver `labelKey` **and** the journey section headers (`ORDERED_CATEGORIES` in `path-nodes.ts`) must both resolve through the **same** `messages.compliance.categories` map. `path-nodes.ts` is therefore part of this change: repoint its header labels at `messages` and delete the local `CATEGORY_NAME_DE` table alongside `JOURNEY_CATEGORY_LABEL`.

#### 3. Registry — declare edges once, get both directions

```ts
// lib/cross-link/registry.ts
const EDGES: Array<{ a: NodeRef; b: NodeRef; kind?: string; note?: string }> = [ ... ];
// indexed at module load into a Map keyed by a canonical NodeRef string, BOTH directions
export function relatedTo(ref: NodeRef): NodeRef[];
```

`relatedTo(ref)` returns forward **and** reverse neighbours from a single declaration, eliminating the manual reverse map. This absorbs:

- `LESSON_JOURNEY_CATEGORY` (`lib/training/lesson-journey-map.ts:13-58`) → `course-lesson ↔ journey-category` edges.
- The existing, currently-unrendered `WikiTocEntry.relatedSlugs` dataset (`lib/content/wiki-toc.ts:136`, hundreds of entries e.g. lines 249/272/295/301) → `wiki ↔ wiki` edges. Feed it in; do not re-author.
- `DocsPageEntry.relatedSlugs` (`lib/content/registry.ts:48-53`, currently `DOCS_PAGES` empty) once docs pages exist.

The registry stays **static / in-memory, no DB, no async**, matching the merged map's deliberate "no DB column" choice and the journey page's `force-dynamic` posture (adding a request-time DB read here would add cost to every journey render).

Gating stays **out** of the registry. A separate pure helper:

```ts
// lib/cross-link/gate.ts
export function canLink(ref: NodeRef, ctx: { companyId?: string; journeyAllowed: boolean; courseId?: string }): boolean;
```

reproduces the current call-site gate (course `nis2-ceo` + `session.companyId` + `isJourneyAllowed`, see `app/[locale]/training/courses/[courseId]/[lessonId]/page.tsx:34-42`). The registry remains pure data so security gating can never be bypassed by adding an edge.

#### 4. Generic components

```ts
// components/cross-link/CrossLink.tsx     — inline link from a NodeRef (inline case ONLY)
// components/cross-link/RelatedLinks.tsx  — "See also" list from relatedTo(ref)
```

`CrossLink` is the **inline-link presentation only**: it calls `resolveTarget`, resolves `labelKey` through next-intl, and renders the object-href `<Link>` (the correct typed primitive lifted from `JourneyLink.tsx:24-40`). It replaces `JourneyLink`. It does **not** absorb the button and card CTAs. Folding inline-link, `Button`, and marketing-`Card` presentation into one `kind`-keyed component would re-introduce the presentation branching this design removes — a god-component. Instead, destination logic lives in `resolveTarget` (pure, shared) and presentation stays split: `CoursePortalCta` (a button) and `StartJourneyCta` (a card) keep their own shells and call `resolveTarget` themselves, sharing routing truth without sharing a render tree. Copy comes from next-intl messages (not DE/EN ternaries) so it works across all 10 locales in `i18n/routing.ts`; the resolver must degrade gracefully for the seven locales beyond `en|de|nl` that `journey/page.tsx:33` currently narrows to. `RelatedLinks` drops into `RequirementDetail`, wiki `[category]/[slug]` pages, and `LessonViewerPage`.

#### 5. Deep-link-to-node behaviour — one shared focus/scroll mechanic + one DOM convention

```ts
// hooks/useFocusScroll.ts
export function useFocusScroll(opts?: {
  block?: ScrollLogicalPosition; // "center" (PathFlow) | "start" (ComplianceProgress)
  highlightMs?: number;          // 2300 default; 0 = scroll without spotlight
}): {
  focusedId: string | null;
  focus: (anchorId: string) => void; // imperative trigger (onClick callers)
};
```

This is **one shared mechanic, two distinct triggers**, not a single param-only deep-link hook. The mechanic — query `[data-cross-link-id="<anchor>"]`, `scrollIntoView({ block })` guarded by `prefers-reduced-motion`, set a transient `focusedId`, clear after `highlightMs` — is lifted **verbatim** from `PathFlow.tsx:164-182` (its `block: "center"`, 300 ms delay, 2300 ms highlight become the defaults). It must serve two callers whose entry points differ:

- **PathFlow — on-mount `?focus` deep-link.** Reads the `?focus` param once on mount and focuses the resolved anchor. The param is a *category* code; the resolver has already mapped it to `step-<firstRequirementCode>` for the DOM lookup (see §2), so the hook never sees the category/requirement mismatch.
- **ComplianceProgress — imperative `onClick`.** Its progress segment is a click handler (`ComplianceProgress.tsx:96` `onClick`, today an inline `document.getElementById(seg.code).scrollIntoView({ block: "start" })`), **not** a mount-time deep-link. It calls the returned `focus(anchorId)` imperatively with `{ block: "start" }`.

Return `focusedId` so any list styles its own highlight (the `ring-2 ring-primary` spotlight at `PathFlow.tsx:686-687` becomes a consumer concern). `prefers-reduced-motion` stays an internal guard of the mechanic, honoured for both triggers.

**Convention:** every deep-link/scroll target stamps `data-cross-link-id={anchorId}`. This collapses the two divergent implementations onto one:

- `PathFlow.tsx:231` `<li id={`step-${node.code}`}>` → `data-cross-link-id={`step-${node.code}`}` (renames PathFlow's existing live id onto the convention).
- `ComplianceProgress.tsx:96-100` keeps its `onClick` but routes through `useFocusScroll`'s imperative `focus()`, gaining the highlight for free. Its scroll **target** is a `RequirementCard`, which today carries **no** matching anchor, so the click currently scrolls nowhere (a latent dead-scroll bug). The fix therefore **adds** `data-cross-link-id={`step-${code}`}` to `RequirementCard` — it does not rename a live id, because the target has none to rename.

#### Module / file layout

```
lib/cross-link/
  node.ts        NodeRef union + canonical string key
  resolve.ts     resolveTarget(ref, locale)
  registry.ts    EDGES + relatedTo(ref) (bidirectional index)
  gate.ts        canLink(ref, ctx)
components/cross-link/
  CrossLink.tsx
  RelatedLinks.tsx
hooks/
  useFocusScroll.ts
```

### Files to add/change

**Add:** the seven files above.

**Change (migration, no behaviour change):**

- `app/[locale]/(portal)/journey/PathFlow.tsx` — replace the inline focus `useEffect` (145-182) with `useFocusScroll` (its on-mount `?focus` trigger); change anchor at line 231 to `data-cross-link-id`; drive `highlighted` from `focusedId`.
- `app/[locale]/(portal)/journey/page.tsx:21-39,72-77` — keep parsing `?focus=`, pass through unchanged.
- `app/[locale]/(portal)/journey/path-nodes.ts:137-166` — repoint `ORDERED_CATEGORIES.nameDe` (the journey section-header labels the `?focus` scroll lands on) at the `messages.compliance.categories` map; delete the local `CATEGORY_NAME_DE` table so headers and the resolver `labelKey` share one source.
- `components/training-portal/LessonViewerPage.tsx:12,184` — swap `JourneyLink` for `CrossLink` fed a `journey-category` `NodeRef`.
- `app/[locale]/training/courses/[courseId]/[lessonId]/page.tsx:34-42` — keep server-side gating, expressed via `canLink`; build the `NodeRef` from `journeyCategoryForLesson`-equivalent registry lookup.
- `components/compliance/ComplianceProgress.tsx:96-100` — keep the `onClick`; replace its inline `getElementById(...).scrollIntoView` with `useFocusScroll`'s imperative `focus(anchorId)` (`{ block: "start" }`).
- `components/compliance/RequirementCard.tsx` — **add** `data-cross-link-id={`step-${code}`}` to the card wrapper (latent dead-scroll bugfix; the scroll target carries no matching anchor today, so the progress-bar click lands nowhere).
- `components/training-portal/CoursePortalCta.tsx`, `StartJourneyCta.tsx` — keep their own button/card shells; have each call `resolveTarget` + `canLink` for destination + gating. Do **not** fold them into `CrossLink`. These encode "where does this course CTA go" destination logic that must be preserved.

**Delete after migration:** `lib/training/lesson-journey-map.ts` (its data moves into `registry.ts` edges; its `JOURNEY_CATEGORY_LABEL` table is dropped in favour of the single `messages`-derived label) and `components/training-portal/JourneyLink.tsx`.

### Phased steps (smallest valuable slice first)

1. **Hook + convention only.** Add `useFocusScroll` (mount-time `?focus` path); migrate `PathFlow` to it and `data-cross-link-id`. Behaviour identical. This alone removes one of the two scroll copies and is independently shippable.
2. **Adopt the convention in ComplianceProgress + fix the dead scroll.** Route the segment `onClick` through `useFocusScroll.focus()`; **add** `data-cross-link-id` to `RequirementCard` (the previously-anchorless scroll target). Second scroll copy gone, the click now actually lands, and the requirement list gains the highlight.
3. **node.ts + resolve.ts + registry.ts (data only).** Define the two live `NodeRef` kinds; seed with the lesson↔category edges migrated from `LESSON_JOURNEY_CATEGORY`. Repoint `path-nodes.ts` headers + the resolver `labelKey` at `messages.compliance.categories` (single label source). Unit-test `relatedTo` bidirectionality and `resolveTarget` hrefs.
4. **CrossLink + canLink.** Migrate `LessonViewerPage` (inline link) and the lesson page gating. Retire `JourneyLink`. Verify the course→journey link is byte-for-byte the same destination + gating.
5. **Re-point CoursePortalCta / StartJourneyCta** at `resolveTarget` + `canLink`, keeping their button/card shells (not folded into `CrossLink`).
6. **RelatedLinks + first new expansion.** Add the `wiki` `NodeRef` kind, ingest `wiki relatedSlugs` into the registry, and render `RelatedLinks` on wiki `[category]/[slug]` pages (`app/[locale]/wiki/[category]/page.tsx:84-104`) — a large dataset that renders nowhere today.

#### Concrete future expansions (enabled, not all built now)

- **wiki ↔ wiki** — `relatedSlugs` rendered via `RelatedLinks` (slugs resolved to localized URLs through the existing per-locale slug map; do not assume a generated route).
- **journey item ↔ wiki explainer** — `journey-category`/`requirement` ↔ `wiki` edges so a journey step links to its deep-dive.
- **compliance requirement ↔ course lesson** — `requirement` ↔ `course-lesson` edges; `RelatedLinks` in `RequirementDetail` surfaces the lesson that teaches that control, and the reverse renders the requirement on the lesson.

### Risks + mitigations

| Risk | Mitigation |
|---|---|
| Generic resolver widens pathname to `string`, breaking next-intl typed `<Link>` (would invite `as any`). | Per-kind `as const` href map; resolver returns the typed `Href`. Typecheck gate in CI. |
| Labels are already quadruplicated (4 sources, not 3) and drifting. | Resolver `labelKey` **and** journey section headers (`ORDERED_CATEGORIES` / `path-nodes.ts`) both read `messages.compliance.categories`; delete `CATEGORY_NAME_DE` and `JOURNEY_CATEGORY_LABEL`. |
| Lesson-id collisions if indexed globally. | `course-lesson` `NodeRef` always carries `courseId`; registry keyed on the composite, never bare `lessonId`. |
| Over-enumerating `NodeRef` kinds with no consumer. | Define only `journey-category` + `course-lesson` now; the discriminated union is extensible by construction, so adding `requirement`/`wiki`/`tool`/`portal-module` later is a localized add (member + one resolver case), not a rewrite. |
| Coarse vs precise journey anchoring. | `journey-category` (category→first-node) ships now; per-requirement precision is the future `requirement` kind plus one resolver case, no rewrite. |
| Adding an edge silently exposes a gated link. | Registry is pure data; visibility is `canLink(ref, ctx)` at the call site only. |
| Request-time cost on a `force-dynamic` page. | Registry/resolver are static, synchronous, in-memory; no DB, no async. |
| Wiki RelatedLinks point at non-existent routes. | Resolve `wiki` slugs through the existing per-locale slug map; skip unresolved slugs. |
| 10 locales but copy is DE/EN ternaries. | `CrossLink` pulls copy from messages; resolver degrades gracefully beyond `en|de|nl`. |

### Verify plan

- `bun run typecheck` (next-intl typed hrefs are the canary).
- Unit tests for `relatedTo` (declare one edge, assert both directions) and `resolveTarget` (each kind → expected href + anchor + `labelKey`).
- Manual: open a `nis2-ceo` lesson, click the journey link, confirm scroll-to + 2.3s highlight identical to pre-migration; repeat with `prefers-reduced-motion` set (no smooth scroll).
- Manual: compliance progress click now **scrolls to and** highlights the target requirement (previously a dead scroll — the `RequirementCard` target had no anchor).
- Confirm the journey section header and the cross-link label render identical text (both from `messages.compliance.categories`, e.g. "Governance & Haftung"), with `CATEGORY_NAME_DE` removed.
- Visual diff of the lesson/course CTAs (destination + when shown) against `main` before merge.

---

## Part B — Activation-cliff fix

### Goal

Make the NIS2 journey **exist at first authenticated entry** so a new user lands inside the product, not on a form wall. Move "name your organization / pick sector / pick entity type" to **progressive, in-context steps inside the journey** (the same first-action card pattern `PathHero` already uses for the asset count). Retire the scattered no-company gating, add a draft/named discriminator so admin metrics stay meaningful, and guard the surfaces that would break against a placeholder company.

The key enabling finding: the 49 NIS2 `company_requirement_status` rows do **not** depend on sector or entity type. `createAssessmentsForFrameworks` (`server/trpc/helpers/setup-helpers.ts:20-65`) loops every active framework and inserts one row per requirement; `entityType` is only stored as `companyAssessment.entityTypeAtAssessment` metadata and is never used to filter requirements. `journey.getItems` (`server/trpc/routers/journey.ts:80-251`) reads neither `company.sector` nor `company.entityType`. So a shell company with placeholder name/sector and `entityType='important'` renders the journey **fully**.

### Design

#### 1. Auto-provision a company at a single post-verification mutation boundary

A shell needs exactly three things: one `company` row, `user.companyId` + `role='admin'` set, and the assessment/requirement rows from `createAssessmentsForFrameworks`. `getSession` reads `companyId` fresh from the DB user row on every request (`lib/auth/config.ts:304`), so flipping it takes effect on the **next** request with no token refresh.

**Provision at one explicit mutation boundary, on the post-verification path** — the email-verification completion handler, or an explicit server action invoked once after verification. Do **not** provision inside the `(portal)` layout RSC render (`layout.tsx`). Next prefetches shared layouts, so a write in the layout render mints companies **speculatively** on prefetch, and a read-then-write "idempotent insert" in an RSC is **non-atomic** with no unique key to fall back on — two concurrent renders both see "no company" and both insert. Move the write to a single mutation boundary and make the insert **idempotent at the DB level** (a unique anchor — e.g. a unique key tying the shell to `userId` — or a row-lock), so a double call is a no-op rather than a duplicate. Explicitly **not**:

- the register route (`app/api/auth/register/route.ts:129`) — the user is unverified and disposable-email signups get a user row but no OTP, so you would mint companies for bots. **No companies for unverified / disposable-email signups.**
- the `(portal)` layout RSC render — speculative prefetch + non-atomic read-then-write, as above;
- `getSession` — it is a per-request read path; a write side-effect there is wrong.

Until provisioning is atomic, **keep `journey/page.tsx`'s no-company guard** as the safety net (a user who somehow reaches `/journey` without a provisioned company still gets redirected, not a crash). Gate the provision itself on **verified + non-disposable + journey-allowed**, and mirror the existing anti-double-provision guard (`assessment.ts:224-233` rejects when the user already has a `companyId`).

#### 2. Split company creation into draft + activate

Today `createCompanyAndAssessment` (`server/trpc/routers/assessment.ts:190-293`) does everything in one transaction: insert company (name/sector/entityType all required), set `companyId`+admin, `createAssessmentsForFrameworks`, `backfillInitialDeadlines`, `processTeamRoleAssignments`. Split it:

- **`createDraftCompany`** — insert a shell (`actsAsNis2Entity=true`, placeholder name/sector, `entityType='important'`), set `user.companyId`+admin, **and seed the assessment/requirement rows** via `createAssessmentsForFrameworks` (NIS2, plus ISO 27001 per the open decision below). The status rows are what `journey.getItems` reads, so seeding them here is what makes the journey render at first entry. **No** deadline backfill and **no** reminder/cron scheduling at draft time. This is what the post-verification provisioning boundary calls.
- **`activateCompany`** (or extend `updateCompany`) — once the user has supplied name/sector/entityType in-journey, run `backfillInitialDeadlines`, schedule reminders, update the `entityTypeAtAssessment` snapshot to the confirmed value, and stamp the named/activated signal.

Rationale (corrected): the journey is **empty** without the 49 `company_requirement_status` rows — deferring `createAssessmentsForFrameworks` to activate contradicts "render the journey at first entry" (`journey.getItems` returns `[]` with no `companyAssessment`). So **seed the rows at draft time**: the rows themselves send **no email** and are cheap; the journey needs them to render. What actually causes spam is the deadline-reminder **cron**, so defer only `backfillInitialDeadlines` + reminder scheduling to `activateCompany`. The placeholder `entityType='important'` is safe at draft because requirement *content* does not depend on entity type (see the enabling finding above) — `activateCompany` restamps `entityTypeAtAssessment` once the real type is picked. (Note default seed activates NIS2 **and** ISO 27001; whether to seed ISO at draft as well is the one remaining open decision — see Sequencing.)

#### 3. Progressive org-setup inside the journey

`PathHero` (`app/[locale]/(portal)/journey/PathHero.tsx:27-58`) is already a "render the lowest unmet precondition as the hero card" pattern (asset card while `assetCount<5`, else next live requirement). **Prepend** org-setup as the first 1–3 precondition cards, in order: name → sector → entity type. Each card writes a **single** field via the existing `assessment.updateCompany` mutation (`assessment.ts:77-138`) rather than the all-at-once create. The field config already exists once: `SECTORS` + entity-type options + overrides in `OnboardingFlow.tsx:52-87` and `lib/organization/constants.ts:8-27`. When the last org field is supplied, fire `activateCompany`.

`PathHero` is a pure server component taking computed counts/flags, so add `company` + a `completeness` prop and branch the same way it already branches on `assetCount`.

#### 4. Retire the no-company gating

With a (draft) company present at first portal entry, these branches simplify or disappear:

- `app/[locale]/(portal)/journey/page.tsx:25` — **keep** `if (!session.companyId) redirect('/dashboard')` as the safety net until provisioning is atomic (see §1); it stops being load-bearing once the post-verification boundary reliably provisions, but costs nothing to leave as a guard.
- `app/[locale]/(portal)/dashboard/page.tsx:12` — drop the `OnboardingBanner` branch; new users now go straight to `/journey`.
- `app/[locale]/(portal)/layout.tsx:101-105` — the `ALLOWED_WITHOUT_COMPANY` array + `showOnboarding` flag become dead once provisioning is universal. (Provisioning itself does **not** live here — it moved to the post-verification boundary, §1.)
- `app/[locale]/(portal)/dashboard/stats/page.tsx:12`, `team/page.tsx:12`, `applicability-admin/page.tsx:9` — no-company redirects become unreachable; remove.
- `app/[locale]/onboarding/page.tsx:10` and `OnboardingBanner.tsx` — the standalone `/onboarding` wizard is superseded by the in-journey flow (open decision: delete vs repurpose as an edit-the-shell flow).
- `components/training-portal/CoursePortalCta.tsx:18-26` / `StartJourneyCta.tsx:34-35` — must branch on **activated**, not merely `companyId` present, or they send users to an org-setup-incomplete `/journey`. (This intersects Part A: the `canLink`/`resolveTarget` logic keys on activation.)
- `packages/isms-trpc/src/init.ts:94-99` — `companyProcedure` stops being the onboarding boundary once everyone has a `companyId`. Do **not** scatter the "is this company activated enough to act on" check across individual mutating handlers. Add a new **`activatedCompanyProcedure`** tier here that extends `companyProcedure` and asserts the named/activated signal in middleware, so the invariant is type-enforced at the procedure boundary. Mutating routers that touch real data (assets/incidents) compose `activatedCompanyProcedure` instead of re-checking by hand.

#### 5. Data hygiene — draft/named discriminator

There is **no** column distinguishing a shell from a named company today (`packages/isms-schema/src/tables/organization.ts:30-36`: `name`/`sector`/`entityType` are `NOT NULL` with no default and no uniqueness; only `createdAt`/`updatedAt` exist). Without one, `totalCompanies` (`platform-admin.ts:68`) and `usersWithCompany` (`:69`) inflate to roughly every verified user, `complianceActivity` lists every shell at 0%, and "Orphan Users / no company yet" (`PlatformAdminPage.tsx:216`) collapses — destroying the activation-funnel signal.

Add a discriminator. Recommended: a nullable `onboardedAt` timestamp (`NULL` = shell) **or** boolean `nameConfirmed`, set by `activateCompany` / first org-name edit via `/organization`. Ship as **Drizzle generate + migrate**, never push (repo rule). Then add a "named/activated companies" filter to `platform-admin` `overview.totalCompanies`, `usersWithCompany`, and the `companies` / `complianceActivity` lists so they count activated companies only, and add the new named-company metric as the activation KPI.

#### 6. Breakage to guard

- **Invite / join flows break hardest.** `team.acceptInvite` (`team.ts:286-291`), `createCompanyAndAssessment` (`assessment.ts:224`), and supplier `onboarding.ts:44,133` all throw `CONFLICT` when the user already has a `companyId`. If every registrant auto-gets a company, an invited user can never join. Redefine "already a member" as "member of a **non-draft** company," or **discard the draft** when accepting an invite.
- **Emails.** `app/api/cron/course-reminders/route.ts:84` keys on `company_id IS NOT NULL`; the status rows are seeded at draft but carry no deadlines and trigger no email — what keeps drafts out of reminder scope is deferring `backfillInitialDeadlines` + reminder scheduling to `activateCompany`. Confirm no other cron joins notification rows by `companyId` for drafts; if one does, filter it on the activated signal.
- **Applicability.** The public `/applicability` tool (`server/trpc/routers/applicability.ts`) is unauthenticated and never touches the company row — unaffected. The authenticated `applicability-admin` page loses its no-company redirect (fine).
- **Exports / PDF.** `app/api/export/report/route.ts:32` (and csv/policy variants) ownership-check `assessment.companyId !== session.companyId` — unaffected by drafts. But `lib/pdf/load-report-data.ts:164` renders `company.name`; a PDF generated for an unnamed shell prints a blank/placeholder name. Cosmetic; gate report generation behind the activated signal or substitute a placeholder string.
- **AI context.** `lib/ai/build-context.ts:27,34` reads placeholder sector/entityType until named — cosmetic.
- **Scope bake-in.** `entityType` is snapshotted into `companyAssessment.entityTypeAtAssessment` at seed time and assessments are created **once** (no auto-re-scope if entityType changes later). Because requirement *content* does not depend on entity type (enabling finding), seeding at draft with the placeholder `'important'` bakes in only a **cosmetic metadata** value, not wrong scope. `activateCompany` restamps `entityTypeAtAssessment` to the confirmed value when the user picks their real entity type — so seed-at-draft and a correct snapshot coexist.

### Files to add/change

**Schema / migration:**
- `packages/isms-schema/src/tables/organization.ts` — add `onboardedAt` (nullable) or `nameConfirmed` (boolean default false).
- `drizzle/` — generated migration (generate + migrate).

**tRPC:**
- `server/trpc/routers/assessment.ts` — split `createCompanyAndAssessment` into `createDraftCompany` (shell + seed status rows, no deadlines/reminders) + `activateCompany` (deadline backfill + reminders + entityType restamp + activated signal); redefine the join guard (`:224`) against non-draft.
- `server/trpc/helpers/setup-helpers.ts` — unchanged primitive (`createAssessmentsForFrameworks`), now called from `createDraftCompany`; `backfillInitialDeadlines` called from `activateCompany`.
- `packages/isms-trpc/src/init.ts:94-99` — add the **`activatedCompanyProcedure`** middleware tier (extends `companyProcedure`, asserts the activated signal). Mutating routers (assets/incidents) compose it.
- `server/trpc/routers/team.ts:286-291`, `server/trpc/routers/supplier-portal/onboarding.ts:44,133` — redefine "already a member" as non-draft / discard draft on invite accept.
- `server/trpc/routers/platform-admin.ts:68-69,104-150` — filter to activated companies; add named-company metric.

**Provisioning boundary (not the layout):**
- email-verification completion handler / explicit post-verification server action — call `createDraftCompany` once for verified, non-disposable, journey-allowed users without a company; insert idempotent at the DB level (unique anchor or row-lock). **Do not** provision in `(portal)/layout.tsx` (speculative prefetch + non-atomic RSC write).
- `app/[locale]/(portal)/layout.tsx:101-105` — remove `ALLOWED_WITHOUT_COMPANY` / `showOnboarding` once provisioning is universal; no write side-effect here.

**Journey UI:**
- `app/[locale]/(portal)/journey/PathHero.tsx:27-58` — prepend org-setup precondition cards writing single fields via `updateCompany`; fire `activateCompany` on completion.
- `app/[locale]/(portal)/journey/page.tsx:25` — **keep** the no-company redirect as a safety net until provisioning is atomic.

**Gating cleanup:**
- `app/[locale]/(portal)/dashboard/page.tsx:12`, `dashboard/stats/page.tsx:12`, `team/page.tsx:12`, `applicability-admin/page.tsx:9`, `onboarding/page.tsx:10` — remove/repurpose redirects and `OnboardingBanner`.
- `components/dashboard/OnboardingBanner.tsx` — delete or repurpose.
- `components/training-portal/CoursePortalCta.tsx`, `StartJourneyCta.tsx` — branch on activated.

**Admin UI:**
- `components/platform-admin/PlatformAdminPage.tsx:216` — replace "Orphan Users" with the activation funnel (registered → activated company).

### Phased steps (smallest valuable slice first)

1. **Discriminator migration first.** Add `onboardedAt`/`nameConfirmed` + backfill existing companies as activated. Update `platform-admin` filters and add the named-company metric. This is the load-bearing prerequisite — ship it before any auto-provisioning so metrics never go blind.
2. **Split the mutation.** `createDraftCompany` (seed the status rows so the journey renders; **no** deadlines/reminders) + `activateCompany` (deadline backfill + reminders + entityType restamp + activated signal). No UI change yet; existing `OnboardingFlow` calls `createDraftCompany` then immediately `activateCompany` to preserve current behaviour.
3. **Fix the join guards** to treat drafts as joinable/discardable. Test invite + supplier-onboarding paths.
4. **Provision at the post-verification boundary** (email-verification completion handler / server action; verified + non-disposable + journey-allowed; idempotent DB-level insert — **not** the portal layout). Now a new user gets a draft company whose journey already renders, and lands on `/journey`; the `journey/page.tsx` guard stays as a net.
5. **Progressive org-setup cards** in `PathHero`; wire single-field writes + `activateCompany` on completion. Repurpose or delete the standalone wizard.
6. **Add `activatedCompanyProcedure`** and compose it in the mutating routers (assets/incidents), **retire the remaining no-company branches**, and update the course CTAs to branch on activated.

### Risks + mitigations

| Risk | Mitigation |
|---|---|
| Metrics go blind (every signup looks like a company). | Discriminator + admin filters land in **Phase 1**, before provisioning. |
| Invite/supplier join permanently `CONFLICT`s. | Redefine "already a member" as non-draft, or discard draft on accept — **Phase 3**, before provisioning. |
| Empty journey at first entry (no status rows = `journey.getItems` returns `[]`). | **Seed** `createAssessmentsForFrameworks` at draft time so the journey renders immediately; the rows send no email. |
| Reminder emails fire for every signup. | Defer only `backfillInitialDeadlines` + reminder/cron scheduling to `activateCompany`; the seeded rows alone trigger nothing. |
| Guessed `entityType` bakes wrong scope (assessments seeded once, no re-scope). | Requirement content is entity-type-independent, so the draft placeholder is cosmetic metadata; `activateCompany` restamps `entityTypeAtAssessment` to the confirmed value. |
| Bots / disposable emails get companies. | Provision at the **post-verification** boundary, not register; gate on verified + non-disposable. |
| Layout-RSC provisioning mints companies on prefetch / races. | Move the write off the `(portal)` layout render to a single post-verification mutation boundary; make the insert idempotent at the **DB level** (unique anchor / row-lock), so concurrent calls are no-ops. Keep `journey/page.tsx`'s guard until atomic. |
| Placeholder name leaks into PDF/exports. | Gate report generation on activated, or substitute a placeholder; ownership checks already hold. |
| `companyProcedure` stops being the onboarding boundary. | New **`activatedCompanyProcedure`** middleware tier enforces "activated enough to act"; mutating routers compose it (no scattered per-handler checks). |
| Standalone `/onboarding` becomes orphaned/conflicting (redirects away once `companyId` set). | Decide intentionally (open decision): delete vs repurpose as edit-the-shell. |

### Verify plan

- Migration: `bun run db:generate` then `db:migrate`; confirm existing companies backfilled as activated, admin counts unchanged.
- New user path (verified, non-disposable test account): post-verification provisioning creates exactly one draft company **with the 49 NIS2 `company_requirement_status` rows seeded** (so the journey is non-empty); first `/journey` entry renders the 49 steps with org-setup cards first; **no** reminder emails scheduled and **no** deadlines backfilled at this stage.
- Idempotency: re-running the provisioning boundary for the same user does **not** create a second company (DB-level unique anchor / row-lock); concurrent prefetch does not duplicate.
- Complete org-setup in-journey → `activateCompany` backfills deadlines, schedules reminders, and restamps `entityTypeAtAssessment` (seeding already happened at draft); named-company metric increments; reminders now in scope.
- Mutating endpoint (e.g. asset create) on a still-draft company is rejected by `activatedCompanyProcedure`; on an activated company it succeeds.
- Invite flow: a user with only a draft company can accept a team invite / supplier invite (draft discarded or treated as joinable).
- Admin: `totalCompanies` / activation funnel reflect activated companies only, not shells.
- Disposable-email / unverified signup gets **no** company (provisioning is post-verification).
- Course CTA from a non-activated draft routes to org-setup, not an org-setup-incomplete journey.

---

## Open decisions + sequencing

**Open decisions, now settled by the seeding fix:**

- **Draft-vs-activate split (settled).** `draft` = `company` row + `user.companyId`/admin + seeded `company_requirement_status` rows (so the journey renders), and **no emails**. `activate` = name/sector/entity-type confirmed + `backfillInitialDeadlines` + reminder scheduling + `entityTypeAtAssessment` restamp + the activated signal. Seeding at draft and email-free draft companies are no longer in tension.
- **Discriminator before provisioning (still holds).** The `onboardedAt`/`nameConfirmed` migration + admin filters must land **before** any auto-provisioning, so the funnel never goes blind.
- **Remaining open:** (1) whether to seed ISO 27001 at draft alongside NIS2, or NIS2 only; (2) delete vs repurpose the standalone `/onboarding` wizard.

Build **Part A first**: it is independent, low-risk, touches no auth/provisioning/metrics, and each phase (hook-only → registry → components) is independently shippable with no behaviour change. It also leaves the codebase cleaner for Part B, because the course→journey CTA destination logic that Part B must re-point at "activated" already lives behind the single pure `resolveTarget` + `canLink` boundary (with the CTAs keeping their own button/card shells) instead of three hand-rolled components.

**Part B is higher-impact but higher-risk** and must follow a strict internal order: the discriminator migration + admin metrics ship **first** (so the funnel never goes blind), then the mutation split (draft seeds rows, activate backfills deadlines/reminders), then the join-guard fix, then **post-verification provisioning** (not the layout), then the progressive UI, then `activatedCompanyProcedure` + retiring the old gating. The two parts intersect at exactly one seam — the course/journey CTA destination logic — where Part A's `canLink` should key on Part B's activated signal once both exist. Sequencing A before B means that seam is a one-line predicate change rather than a refactor.

**See it:** `lib/cross-link/registry.ts` (one declarative edge yields both directions) and `app/[locale]/(portal)/journey/PathHero.tsx:27` (where org-setup cards prepend onto the existing first-action pattern) are the two files that anchor the whole plan.
