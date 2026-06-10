# Journey Views — Feature Plan

> **What this is.** The product layer on top of the v4.1 implementation journey spec. Five view modes — CEO, CISO, Auditor, MSP, Advanced — built as projections of the same 49-requirement journey state.
>
> **What this is not.** Not a new data model. Not a refactor of `/portal/dashboard` (the Advanced view IS that dashboard, reached via switcher). Not a wizard-style stepper. Not five separate dashboards.
>
> **References.** v4.1 spec: `docs/proportional-implementation-journey.md`. Validation: `docs/journey-validation-report.md`. Replaces v4.1 Section 19 build step "Build `/portal/journey` orchestrator" with the full implementation plan below.

> **Fact-check log (legal NIS2 / CIR 2024/2690 / BSIG / due-process).** Plan v1.1 incorporated 8 fact-check fixes:
> - **F1** — Auditor view shows ALL 49 requirements (status visible per row), not signed-only. Auditors come to find gaps. Section 5.3.
> - **F2** — Auditor groups by `legalRef` (BSIG §) for German market by default, with NIS2 Art. as secondary. Section 5.3 + Q5.
> - **F3** — CISO "Overdue" includes `not_started` items. Annual req never started + past due = worst case, must be visible. Section 9.
> - **F4** — `MSP_CATS` adds BCP (§30(2) Nr. 3 "Sicherung" = MSPs operate backups). Section 5.4 + Q3.
> - **F5** — CEO "Blocked on me" v1 limited to sign-off-blocked; decision-blocked handled on Cat 7.3 detail page. Section 5.1.
> - **F6** — CEO empty state shows company-wide overdue counts, not "you're up to date" (§38(2) personal liability — auditor would weaponise the latter). Section 5.1.
> - **F7** — Sort within queue is `(due_at ASC NULLS LAST, requirement.sortOrder ASC)`. Framework sortOrder = canonical journey order. Section 6.
> - **F8** — German-version availability flag 🇩🇪 visible on each card per §23(1) VwVfG. Sections 5.1 + 5.3.
>
> Deferred for v2 (acknowledged): F9 proportionality justification queue (waits for `skipReason` schema in T-2), F10 CISO "Awaiting evidence" + "Incident-triggered" queues, F11–F14 risk/incident/supplier overviews + i18n naming.

---

## 1. Goal

Solve the gap surfaced by the validation report: *"the spec answers what to build, not what Klaus does on Tuesday morning."* Five views, each tailored to one user role + task surface, all backed by the same journey data, with zero new abstractions.

## 2. Non-goals

- Replacing the existing `/portal/dashboard` (it becomes the Advanced view; no refactor)
- Adding `user.functionalRoles[]` taxonomy (deferred — use `isManagement` proxy first)
- Magic-link auditor access (deferred — start with logged-in auditor account)
- Per-view route trees (one route, query param)
- View configuration UI (5 hard-coded views is enough until a customer asks for a 6th)
- Wizard-style "step 1 of 15" UX (the dependency graph + sign-off events drive surfacing, not a sequential UI)

## 3. Architecture in one picture

```
─────────────────────────────────────────────────────────────────
  domain (existing — v4.1 spec is the source)
  
    requirement (49)  ── requirement_prerequisite (46 rules)
                      ── requirement_category (12)
    company_requirement_status (per company × requirement)
       ├── requirement_assignment (per user — RACI receipt)
       ├── sign_off_history (append-only audit)
       └── evidence (artefacts)
─────────────────────────────────────────────────────────────────
                              ↓
  projection (NEW — app/portal/journey/views.ts, ~100 LoC)

    PROJECTIONS: Record<View, (user, reqs, statuses) => Queues>
      ceo:      filter by accountable, queue by status+due
      ciso:     filter by responsible, queue by overdue/week/brief
      auditor:  filter signed_current, group by frameworkRef
      msp:      filter MSP_CATS, group by categoryCode
      advanced: group by categoryCode (mirrors current dashboard)
─────────────────────────────────────────────────────────────────
                              ↓
  view (existing dashboard untouched; new journey page)

    /portal/journey?view=ceo|ciso|auditor|msp|advanced
      <ViewSwitcher /> – switch between views
      <Section />     – one per queue
      <JourneyCard />  – title + status + due + link
                          ↓
    clicking card → /portal/compliance/[categorySlug]#code
                          ↓
    EXISTING DETAIL PAGE handles all the v4.1 hand-holding
    (intake fields, sign-off mechanic, wiki link, workshop, exec questions)
─────────────────────────────────────────────────────────────────
```

## 4. File layout

| File | Purpose | Approx LoC |
|---|---|---|
| `app/[locale]/(portal)/journey/page.tsx` | Route + queue rendering | 20 |
| `app/[locale]/(portal)/journey/views.ts` | `PROJECTIONS` lookup + helpers | 100 |
| `app/[locale]/(portal)/journey/card.tsx` | `<JourneyCard>` — link + title + status + due | 10 |
| `app/[locale]/(portal)/journey/switcher.tsx` | `<ViewSwitcher>` — links between views | 15 |
| `docs/journey-views.md` | This plan | n/a |

**~145 LoC of new code, 4 files, no refactor of existing code.**

## 5. The 5 view specs

### 5.1 CEO view
- **Who.** Management body (`user.isManagement = true`).
- **Filter.** `accountableUserIds(req, company).includes(user.id)`.
- **Queues.**
  - *To sign now* — status = `pending_signoff`. **German-version availability flag 🇩🇪 visible on each card per §23(1) VwVfG** (fact-check F8).
  - *Next 90 days* — due in (0, 90] days, not yet at signoff stage
  - *Blocked on me* — `pending_signoff` with downstream prereqs waiting. **v1 catches sign-off-blocked items only**; decision-blocked items (e.g. management review escalations) are handled directly on Cat 7.3 detail page (fact-check F5).
- **Empty state.** "✅ No pending signatures from you. **Company-wide:** {n} items overdue, {m} due this month. See CISO view for detail." (fact-check F6 — never tell a §38(2)-liable user "you're up to date" while overdue items exist.)
- **Proportionality items.** When the company defers a requirement via `skipReason` (CIR Art. 2(2) "comply or explain"), surface as a separate "Skipped — confirm" queue. Sign-off acknowledges the deferral (deferred until T-2 build of `skipReason` schema — fact-check F9).
- **1-line pitch.** "Things requiring your signature or blocked on your decision."
- **Default for.** Users with `isManagement = true`.

### 5.2 CISO view
- **Who.** `§30(1)` accountable person (`user.id === company.cisoId` or `user.jobTitle` contains CISO/ISB).
- **Filter.** Responsible OR Accountable for any requirement.
- **Queues.**
  - *Overdue* — due date passed, not signed
  - *This week* — due in next 7 days
  - *Brief CEO on* — `requiredSignOffRole = "ceo"` AND status `pending_signoff` AND due in next 30 days
- **Empty state.** "✅ Nothing overdue. Next deadline in {n} days."
- **1-line pitch.** "Your operational queue + what to brief the CEO on."
- **Default for.** Users with cisoName match. Fallback if user is both CEO + CISO: CEO view.

### 5.3 Auditor view
- **Who.** Internal or external auditor doing pre-BSI prep OR a visiting BSI inspector.
- **Filter.** **All 49 requirements** — status visible per row (signed / in-progress / overdue / not-started). **NOT filtered to signed-only** — auditors come to find gaps, not to admire passes (fact-check F1).
- **Grouping.** By `requirement.legalRef` (BSIG §) **as default for German market** — BSI auditors walk the §30(2) Nr. 1–10 + §38 sequence, not the NIS2 Directive Articles (fact-check F2). Toggle/tab offers NIS2 Article (`frameworkRef`) grouping for cross-border auditors.
- **Empty state.** "No assessment exists yet — initialise via Setup."
- **1-line pitch.** "All 49 requirements with current status — what an auditor walks through."
- **Read-only.** No edit affordances visible; detail page detects `?view=auditor` referrer and hides edit. (Defer hard permission gate to T-3 build.)
- **Default for.** Not the default for any user; reached via switcher.
- **Note on per-row indicators.** Each card shows: status pill, last sign-off date, evidence count, German-version availability flag 🇩🇪 (fact-check F8).

### 5.4 MSP view
- **Who.** External IT services provider invited to the company portal (typical for 50–250-person Mittelstand using Bechtle/Cancom).
[redacted for public release]
- **Grouping.** By `categoryCode`.
- **Empty state.** "No IT-domain requirements yet."
- **1-line pitch.** "IT-domain requirements scoped to what your MSP can act on."
- **Default for.** Users with `user.companyId = $someCustomer` AND `user.role = "msp_partner"` (defer the role until MSP-invite feature exists; for v1, only show the view to admins).
- **Reporting jurisdiction note.** Even when MSP detects an incident via SIEM/EDR they operate, **§32 BSIG reporting obligation stays with the entity, not the MSP.** MSP view surfaces incidents for awareness; the reporting flow on `/portal/incidents` belongs to the entity.

### 5.5 Advanced view
- **Who.** Power users (CISO, compliance lead, internal team).
- **Filter.** None — all 49 requirements.
- **Grouping.** By `categoryCode` (12 buckets, same as current dashboard).
- **Empty state.** Only meaningful when company has no assessment — UX in current dashboard already handles this.
- **1-line pitch.** "Show me everything — same as the dashboard."
- **Default for.** Users with `isManagement = false` AND no CISO match (general team members).
- **Note.** This view IS the existing `/portal/dashboard`. Two implementations:
  - **Option A (recommended):** `/portal/journey?view=advanced` redirects to `/portal/dashboard`. Single source of truth.
  - **Option B:** Reimplement in `PROJECTIONS.advanced` for parity. Doubles maintenance.
  - **Decision.** Option A. The switcher uses different URLs but the dashboard view is one component.

## 6. Decisions table (the things code can't self-document)

| Decision | Choice | Rationale |
|---|---|---|
| Default view per user | `isManagement && !cisoMatch` → ceo; `cisoMatch` → ciso; else advanced | Uses existing schema; no migration |
| Switcher visibility | All views visible to all logged-in users for v1 | No functionalRoles taxonomy yet; visibility filter is one-liner when role data lands |
| URL persistence | `?view=X` in query param; default infers when absent | Shareable, refresh-stable, no localStorage |
| Empty-state copy | Per-queue constant in `views.ts`, German + English | i18n via existing `messages/` files |
| Mobile collapse | Phone: stack queues vertically; "Next 90 days" and "Brief CEO" collapsed by default | Reduces noise on small screens |
| Multi-role users | Switcher lets user pick; no per-user pin in v1 | Defer pin setting until requested |
| Auditor read-only | Detail page reads `?view=auditor` from referrer, hides edit | Soft gate, sufficient for v1; hard gate when functionalRoles lands |
| Feature flag per view | All 5 ship together by default | Flag only if shipping CEO first and holding others back |
| Card click target | Whole card is the link; no button-in-card | Mobile-friendlier, fewer hit targets |
| Sort within queue | By `(due_at ASC NULLS LAST, requirement.sortOrder ASC)` | `sortOrder` tiebreaker uses the framework's canonical journey order (REG → GOV → RSK → …) — fact-check F7 |

## 7. DB integration (verified — no new tables)

### 7.1 The chain

```
requirement_category  (12)
    └─► requirement  (49) ── requirement_prerequisite (46)
            └─► company_requirement_status (per company × requirement)
                    ├─► requirement_assignment (per user — RACI receipt)
                    ├─► sign_off_history (append-only)
                    └─► evidence
```

### 7.2 FKs in place

- `requirement_assignment.status_id → company_requirement_status.id`
- `requirement_assignment.user_id → user.id`
- `sign_off_history.status_id → company_requirement_status.id`
- `company_requirement_status.assessment_id → company_assessment.id`
- `company_requirement_status.requirement_id → requirement.id`
- All `ON DELETE no action` — preserves audit trail

### 7.3 Indexes in place

- `idx_req_status_assessment`
- `idx_req_status_requirement`
- `idx_req_prereq_pair` UNIQUE
- `idx_sign_off_history_status`
- `uq_req_assign` UNIQUE on (status_id, user_id)

No new indexes needed for v1.

### 7.4 Parent-to-child insertion order (already correct in `seed.ts`)

1. `user`
2. `company` + `company_assessment` (atomic via `createCompanyAndAssessment`)
3. `company_requirement_status` × 49 (auto-derived from framework data)
4. Operational entities (`asset`, `risk`, `supplier`, `policy`, etc.)
5. Sign-offs flow into `sign_off_history` + `status.signedOffAt` updates

### 7.5 The sparse-assignment gotcha + the dynamic helper

**Problem.** `requirement_assignment` is currently populated only at sign-off time, not as a pre-existing RACI matrix. The CEO/CISO projections need to know "is this user Accountable for this requirement" without depending on assignment rows.

**Solution (v1).** `accountableUserIds(req, company)` returns the inferred Accountable user IDs from existing data:

```ts
function accountableUserIds(req: Requirement, company: Company): string[] {
  // CEO-signoff requirements: all management body members
  if (req.requiredSignOffRole === "ceo") {
    return company.users.filter(u => u.isManagement).map(u => u.id);
  }
  // CISO-led categories: the named CISO
  if (["RSK", "INC", "EFF", "TRN", "ACC"].includes(req.categoryCode)) {
    const ciso = company.users.find(u => u.id === company.cisoId);
    return ciso ? [ciso.id] : [];
  }
  // Category lead role from framework data
  const leadRole = framework.categoryLeads[req.categoryCode];  // e.g. "coo" for BCP
  const lead = company.users.find(u => u.jobTitle?.toLowerCase().includes(leadRole));
  return lead ? [lead.id] : [];
}
```

**Solution (v2 — deferred).** When customers want custom RACI, bulk-seed `requirement_assignment` on company creation from the spec's master RACI matrix (Section 17 of v4.1 spec). The helper falls back to assignment rows if any exist, else dynamic.

## 8. Build steps (correct order — each unlocks the next)

**Phase A — Skeleton (architecture online, no real data flowing)**

1. Create `app/[locale]/(portal)/journey/views.ts` with `View` type + empty `PROJECTIONS` lookup. All 5 keys return `{}`.
2. Create `/portal/journey` route + page shell. Reads `?view=` param, calls `PROJECTIONS[view](...)`, renders queues.
3. Create `<JourneyCard req>` — title + status pill + due date + link to `/portal/compliance/[categorySlug]#code`. Zero conditionals.
4. Create `<ViewSwitcher current>` — links between views.
5. Add `defaultViewFor(user, company)` helper using `isManagement` + `cisoId` proxy.
6. **Smoke test.** Log in, hit `/portal/journey`, see empty queues, switch views, click a card → existing detail page opens.

**Phase B — Projections (one at a time, in this order)**

7. Implement `accountableUserIds(req, company)` helper (Section 7.5).
8. Fill `PROJECTIONS.advanced` — Option A: `redirect(/portal/dashboard)`. Done.
9. Fill `PROJECTIONS.ceo` — three queues: *To sign now / Next 90 days / Blocked on me*. Uses `accountableUserIds`.
10. Fill `PROJECTIONS.ciso` — three queues: *Overdue / This week / Brief CEO*. Uses RACI proxy (`user.id === company.cisoId`).
11. Fill `PROJECTIONS.auditor` — `groupBy(reqs.filter(signed_current), r => r.frameworkRef)`.
12. Fill `PROJECTIONS.msp` — `groupBy(reqs.filter(MSP_CATS.includes(r.categoryCode)), r => r.categoryCode)`.

**Phase C — Polish (only what's needed after observing usage)**

13. Add "Show everything →" link from journey to dashboard (top of page).
14. Add "Simplified view →" link from dashboard to journey (top of dashboard).
15. Empty-state copy per queue (write the copy from the EN+DE strings file; reference Section 5).
16. Mobile collapse rules — implement responsive behaviour from decisions table.

**Phase D — Tests (parallel to B+C, not blocking)**

17. Unit test `accountableUserIds` — 4 cases (CEO requirement, CISO category, lead-role category, no-match).
18. Unit test each projection — verify queue assignment is correct given fixture data.
19. Integration test — load `/portal/journey?view=ceo` for fixture company, verify queues match expected.

## 9. Acceptance criteria — what "done" looks like per view

| View | Done when |
|---|---|
| CEO | (a) For a logged-in `isManagement` user, "To sign now" lists only requirements with `requiredSignOffRole = "ceo"` AND status = `pending_signoff` AND all prereqs signed. (b) Clicking a card opens the detail page at the right anchor. (c) Empty state renders when no items in any queue. |
| CISO | (a) For a user matching `company.cisoId`, "Overdue" lists requirements where `status != "signed_current" AND due_at < now`. **Includes `not_started` items** — annual requirements that were never started + are past due are the worst case and must be visible (fact-check F3). (b) "Brief CEO" lists requirements `requiredSignOffRole = "ceo"` AND `pending_signoff` AND due in next 30d. (c) Known v1 gap: "Awaiting evidence" + "Incident-triggered" queues deferred (fact-check F10). |
| Auditor | (a) Every requirement shown has status = `signed_current`. (b) Grouped by NIS2 Article. (c) No edit buttons visible. |
| MSP | (a) Only `MSP_CATS` categories shown. (b) Grouped by category. (c) Switcher hidden for users without admin role. |
| Advanced | (a) Switcher entry redirects to `/portal/dashboard`. (b) "Simplified view →" link visible on dashboard. |

## 10. Permissions / role gating

| Resource | Gate |
|---|---|
| Access to `/portal/journey` | Any logged-in user with `companyId` |
| View switcher visible | Always (v1); filter by `functionalRoles[]` when that taxonomy lands |
| Edit affordances in detail page | Existing role check (`admin` / `member`); `viewer` already read-only |
| Auditor view | Reachable to all in v1 via switcher; hard gate when `functionalRoles` lands |
| MSP view | Show only to admins in v1; gate by `role = "msp_partner"` when MSP-invite feature exists |
| Sign-off action | Existing logic — checks `requiredSignOffRole` against `user.isManagement` or `requirement_assignment` |

## 11. Performance budget

- Initial page load: < 200 ms server-side for 49 requirements (no joins beyond status + prereq).
- Switcher click: < 50 ms (single query change).
- Empty-state render: instant.
- 5 projections × 49 requirements = ~250 in-memory predicates per load. Microseconds. No memoization needed.

If load > 200 ms in staging: add `cache()` wrapper on the requirement+status query (reused across views in the same request). One-line change.

## 12. What's deferred (don't gate shipping on any of these)

| Item | When | Where it'll go |
|---|---|---|
| `user.functionalRoles[]` migration | Customer asks for custom RACI | T-2 in v4.1 spec Section 19 |
| `requirement_assignment` bulk-seed from master matrix | Same | T-2 |
| Hard permission gate for auditor (read-only mode) | Same | T-2 |
| Magic-link auditor access | First external auditor asks | T-3 |
| MSP scoped role + invitation flow | First MSP customer | T-3 |
| Per-user pinned default view | When users complain about default | Quick add — UI setting |
| Mobile-first dedicated `/m/journey` route | Mobile traffic > 30 % of journey use | Responsive CSS first |
| Feature flag per view | Shipping incrementally | One-liner wrap on `PROJECTIONS[view]` |
| Workshop mode for Cat 2.2 / 2.3 / 4.5 | T-3 build item from v4.1 | Detail page enhancement; orthogonal to views |
| D&O defence pack export | T-3 build item | Separate `/portal/export/d-and-o-pack` route |

## 13. Open questions (require user decision before step 1)

1. **Naming.** Is `/portal/journey` the right URL? Alternative: `/portal/me` or `/portal/inbox`. Recommend: `/portal/journey` to keep continuity with the spec.
2. **Default view tiebreaker.** If a user matches BOTH `isManagement = true` AND `cisoId = user.id`, do they default to CEO or CISO view? Recommend: CEO (more urgency surface; user can switch to CISO). **Legal basis:** §38 duties take priority over §30(1) duties.
3. **MSP_CATS constant — UPDATED per fact-check F4.** Confirm: `["RSK", "PRO", "CRY", "ACC", "AUT", "INC", "BCP"]`. Adds BCP because §30(2) Nr. 3 BSIG ("Sicherung") is MSP territory. TRN + EFF remain conditional opt-in per customer. Excludes GOV (internal), SUP (procurement), REG (legal).
4. **Auditor view URL signal.** Use referrer `?view=auditor` or a fresh query param `?audit=true` on the detail page? Recommend: referrer (`document.referrer` check), no new param.
5. **Auditor grouping default — NEW per fact-check F2.** German market: group by `legalRef` (BSIG §). Cross-border / EU-wide: group by `frameworkRef` (NIS2 Art.). Default to BSIG § based on `company.country = DE`, fallback to NIS2 Art.

## 14. Memory + cross-references

After this feature ships:
- Update `MEMORY.md` to point at this plan as the live UX source of truth.
- Mark the corresponding T-3 line in v4.1 spec Section 19 as "done — see `docs/journey-views.md`."
- Add a "see also" link from the existing `/portal/dashboard` page header pointing at the new journey route.

---

*This plan is intentionally low-abstraction. ~145 LoC of new code, zero new database tables, zero refactor of the existing dashboard, zero abstractions beyond a typed lookup table. Adding a 6th view is one new key + one new function. Removing a view is the inverse. Each projection is an isolated pure function.*
