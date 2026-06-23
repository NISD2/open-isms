/**
 * Journey view projections.
 *
 * The whole journey-views architecture is this lookup table. Each entry is a
 * pure function that takes the user + the company's 49 requirement statuses
 * and returns a Map of named queues. The page renders queues; cards link to
 * the existing /portal/compliance/[categorySlug] detail page where all the
 * hand-holding (intake fields, sign-off mechanic, wiki link, workshop,
 * exec questions) already lives.
 */

export type View = "path" | "ceo" | "ciso" | "auditor" | "msp" | "advanced";

export type JourneyItem = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  categoryCode: string;
  categorySlug: string;
  status: string;
  priority: string | null;
  frequency: string | null;
  legalRef: string | null;
  frameworkRef: string | null;
  requiredSignOffRole: string | null;
  dueAt: Date | null;
  signedOffAt: Date | null;
  sortOrder: number;
  /**
   * Count of downstream requirements (where this is a prereq) that are NOT
   * yet signed_current. Used by CEO "Blocked on me" queue to show items
   * that would unblock other work once signed.
   */
  blocksCount: number;
};

export type Queues = Record<string, JourneyItem[]>;

export type ProjectionInput = {
  userId: string;
  isManagement: boolean;
  items: JourneyItem[];
};

export type ProjectionFn = (input: ProjectionInput) => Queues;

// MSP_CATS — fact-check F4: includes BCP because §30(2) Nr. 3 BSIG ("Sicherung")
// is MSP territory in practice (MSPs run backups).
// TRN + EFF are conditional opt-in per customer (deferred to v2).
const MSP_CATS = ["RSK", "PRO", "CRY", "ACC", "AUT", "INC", "BCP"];

// CISO-led categories per the framework `relevantRoles` data.
const CISO_CATS = ["RSK", "INC", "EFF", "TRN", "ACC"];

/** Days between two dates; positive if `target` is in the future. */
function daysFromNow(target: Date | null): number | null {
  if (!target) return null;
  return Math.floor((target.getTime() - Date.now()) / 86_400_000);
}

function withinDays(item: JourneyItem, n: number): boolean {
  const d = daysFromNow(item.dueAt);
  return d !== null && d > 0 && d <= n;
}

function overdue(item: JourneyItem): boolean {
  const d = daysFromNow(item.dueAt);
  return d !== null && d < 0;
}

/**
 * Terminal-success status — the work is done. Schema `item_status` enum:
 * not_started / in_progress / completed / not_applicable / needs_review /
 * approved / rejected. Both `approved` and `not_applicable` mean we don't
 * need to surface the item in any "to-do" queue.
 */
function isDone(item: JourneyItem): boolean {
  return item.status === "approved" || item.status === "not_applicable";
}

/** Awaiting sign-off — schema status `needs_review`. */
function awaitingSignoff(item: JourneyItem): boolean {
  return item.status === "needs_review";
}

/**
 * Sort within a queue: by due_at ASC (NULL last), then by sortOrder ASC
 * (canonical journey order from framework data). Fact-check F7.
 */
function compareForQueue(a: JourneyItem, b: JourneyItem): number {
  const aDue = a.dueAt?.getTime() ?? Number.POSITIVE_INFINITY;
  const bDue = b.dueAt?.getTime() ?? Number.POSITIVE_INFINITY;
  if (aDue !== bDue) return aDue - bDue;
  return a.sortOrder - b.sortOrder;
}

/** Group items by a string key; preserves canonical ordering within groups. */
function groupBy(
  items: JourneyItem[],
  key: (item: JourneyItem) => string,
): Record<string, JourneyItem[]> {
  const out: Record<string, JourneyItem[]> = {};
  for (const item of items) {
    const k = key(item) || "Other";
    const bucket = out[k];
    if (bucket) bucket.push(item);
    else out[k] = [item];
  }
  for (const arr of Object.values(out)) arr.sort(compareForQueue);
  return out;
}

/**
 * Extract the primary BSIG §-reference for auditor grouping. Many legalRef
 * strings are like "§30(2) Nr. 1 BSIG, CIR 12, §28 BSIG" — grouping by the
 * raw string fragments the audit view. We pull just the leading § up to
 * "Nr. X" so multiple requirements under the same § collapse into one group.
 */
function primaryBsigParagraph(legalRef: string | null): string {
  if (!legalRef) return "Other";
  const m = legalRef.match(/§\s*\d+(?:\s*\(\s*\d+\s*\))?(?:\s*Nr\.\s*\d+)?/);
  if (!m) return legalRef.split(",")[0]?.trim() ?? legalRef;
  return m[0].replace(/\s+/g, " ").trim();
}

/**
 * Whether the given user is accountable (Accountable role in RACI) for the
 * given requirement. v1 — based ONLY on real schema fields (no name/title
 * heuristics). Two truthy paths:
 *
 *  - requiredSignOffRole === "ceo" AND user.isManagement → management body
 *    member is collectively accountable for §38(1) approval items.
 *
 * Per-category lead-role accountability (CISO for RSK/INC/EFF/TRN/ACC; CTO
 * for PRO/CRY/AUT; COO for BCP; etc.) requires user.functionalRoles[] —
 * not modelled yet (T-2 in v4.1 spec). Until then CISO/CTO/COO accountability
 * lives in the CISO / MSP / advanced views, reached via the switcher.
 */
function isAccountable(
  item: JourneyItem,
  input: { isManagement: boolean },
): boolean {
  if (item.requiredSignOffRole === "ceo") return input.isManagement;
  return false;
}

/**
 * The single live node for the novice "path" view: the lowest-sortOrder
 * requirement that is not yet done. Everything before it is done, everything
 * after is locked-but-visible. Returns null when the path is complete.
 */
export function liveNode(items: JourneyItem[]): JourneyItem | null {
  const open = items
    .filter((i) => !isDone(i))
    .sort((a, b) => a.sortOrder - b.sortOrder);
  return open[0] ?? null;
}

export const PROJECTIONS: Record<View, ProjectionFn> = {
  // Novice path: collapse the whole journey to the single live node. The page
  // renders this view as a prescribed-action hero, not the queue list.
  path: (input): Queues => {
    const live = liveNode(input.items);
    return live ? { "Start here": [live] } : {};
  },
  ceo: (input) => {
    const mine = input.items.filter((i) => isAccountable(i, input));
    return {
      "To sign now": mine.filter(awaitingSignoff).sort(compareForQueue),
      "Next 90 days": mine
        .filter((i) => !isDone(i) && !awaitingSignoff(i) && withinDays(i, 90))
        .sort(compareForQueue),
      // "Blocked on me" = items awaiting my signature that would unblock
      // downstream work. Uses blocksCount computed from requirement_prerequisite
      // joined in journey.getItems.
      "Blocked on me": mine
        .filter((i) => awaitingSignoff(i) && i.blocksCount > 0)
        .sort(compareForQueue),
    };
  },
  ciso: (input) => {
    // CISO view is the operational catch-all: every requirement that the
    // operational lead (CISO / CTO / COO / HR — anyone not strictly the
    // management body's §38 sign-off duty) needs to drive. We don't filter
    // by user identity (no fragile name-matching) — anyone who picks this
    // view sees the same operational queue.
    const mine = input.items.filter(
      (i) => i.requiredSignOffRole !== "ceo" || CISO_CATS.includes(i.categoryCode),
    );
    return {
      // Fact-check F3: includes not_started items past due — annual reqs
      // never started + past due are the worst case and must be visible.
      Overdue: mine
        .filter((i) => !isDone(i) && overdue(i))
        .sort(compareForQueue),
      "Awaiting sign-off": mine
        .filter(awaitingSignoff)
        .sort(compareForQueue),
      "Open — needs scheduling": mine
        .filter((i) => !isDone(i) && !awaitingSignoff(i) && i.dueAt === null)
        .sort(compareForQueue),
      "Coming up (90 days)": mine
        .filter((i) => !isDone(i) && !awaitingSignoff(i) && withinDays(i, 90))
        .sort(compareForQueue),
      "Brief CEO": mine
        .filter(
          (i) =>
            i.requiredSignOffRole === "ceo" &&
            awaitingSignoff(i) &&
            withinDays(i, 30),
        )
        .sort(compareForQueue),
    };
  },
  auditor: (input) =>
    // Fact-check F1: show ALL requirements (status visible per row), NOT
    // signed-only — auditors come to find gaps. Fact-check F2: group by
    // BSIG § for German market default (normalize the legalRef so
    // multi-§ strings collapse into the primary paragraph).
    groupBy(input.items, (i) => primaryBsigParagraph(i.legalRef)),
  msp: (input) =>
    // Fact-check F4: MSP_CATS includes BCP because §30(2) Nr. 3 "Sicherung"
    // is MSP territory in practice.
    groupBy(
      input.items.filter((i) => MSP_CATS.includes(i.categoryCode)),
      (i) => i.categoryCode,
    ),
  advanced: () => ({}), // page.tsx redirects to /dashboard
};

/**
 * Pick the default view for a user from real schema fields only.
 * Management → CEO (§38 personal duties). Everyone else → Advanced.
 *
 * CISO is reached via the switcher — we don't try to auto-default to it
 * because there's no canonical way to identify the CISO from current
 * schema without fragile name/title matching. When user.functionalRoles[]
 * lands, we'll switch to: isCiso ? "ciso" : isManagement ? "ceo" : ...
 */
export function defaultViewFor(_opts: { isManagement: boolean }): View {
  // Stage 0: the novice path is the universal default post-login surface.
  // The role-views (ceo/ciso/...) remain reachable via the switcher.
  return "path";
}

/**
 * Validate ?view= param. Falls back to default if missing/invalid.
 */
export function parseView(raw: string | undefined): View | null {
  if (!raw) return null;
  const valid: View[] = ["path", "ceo", "ciso", "auditor", "msp", "advanced"];
  return (valid as string[]).includes(raw) ? (raw as View) : null;
}

export const VIEW_LABELS: Record<View, { en: string; de: string }> = {
  path: { en: "Start", de: "Start" },
  ceo: { en: "CEO", de: "Geschäftsleitung" },
  ciso: { en: "CISO", de: "CISO" },
  auditor: { en: "Auditor", de: "Auditor" },
  msp: { en: "MSP", de: "MSP" },
  advanced: { en: "Everything", de: "Alles" },
};

/** Categories this MSP scope can act on. Exported for tests + future tooling. */
export { MSP_CATS, CISO_CATS };
