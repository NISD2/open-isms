// Sample data for the /journey-preview design route. No DB, no auth.
// Shapes mirror the real journey (FlowNode + Aggregate) so the redesigned
// board drops into the real page unchanged. Titles are localized separately
// (sample-titles.ts) so the preview can be screenshotted per locale.
import type { FlowNode, Aggregate } from "../(portal)/journey/path-nodes";
import type { FrameworkGroup } from "@/components/portal/AppSidebar";

type Seed = {
  code: string;
  band: FlowNode["band"];
  column: FlowNode["column"];
  ownerRole: string;
  status: FlowNode["status"]; // "done" | "current" | "upcoming"
  prepared?: boolean; // auto-drafted -> needs_review (review-and-sign)
  frequency?: string | null;
  priority?: string | null;
  legalRef?: string | null;
  dueInDays?: number | null;
};

const SEEDS: Seed[] = [
  // Defensible minimum — REG cluster first (global order), then the rest.
  { code: "12.1", band: "minimum", column: "leadership", ownerRole: "ceo", status: "current", legalRef: "§ 28 BSIG", priority: "P0" },
  { code: "12.2", band: "minimum", column: "leadership", ownerRole: "ceo", status: "upcoming", legalRef: "§ 33 BSIG", priority: "P0" },
  { code: "1.2", band: "minimum", column: "leadership", ownerRole: "ceo", status: "done", legalRef: "Art. 20 NIS2", priority: "P0" },
  { code: "2.1", band: "minimum", column: "security", ownerRole: "ciso", status: "done", legalRef: "§ 30 BSIG", priority: "P0" },
  { code: "2.2", band: "minimum", column: "security", ownerRole: "ciso", status: "done", legalRef: "§ 30 BSIG", priority: "P0" },
  { code: "2.4", band: "minimum", column: "leadership", ownerRole: "ceo", status: "done", priority: "P0", frequency: "annual", dueInDays: 210 },
  { code: "3.1", band: "minimum", column: "security", ownerRole: "ciso", status: "done", legalRef: "§ 32 BSIG", priority: "P0" },
  { code: "3.3", band: "minimum", column: "security", ownerRole: "ciso", status: "upcoming", prepared: true, legalRef: "§ 32 BSIG", priority: "P0" },

  // Over the year
  { code: "10.1", band: "year", column: "leadership", ownerRole: "ceo", status: "done", legalRef: "§ 38 BSIG", frequency: "annual", dueInDays: 40 },
  { code: "10.2", band: "year", column: "security", ownerRole: "ciso", status: "done", frequency: "annual", dueInDays: -6 },
  { code: "4.1", band: "year", column: "it", ownerRole: "cto", status: "done" },
  { code: "5.1", band: "year", column: "it", ownerRole: "cto", status: "done" },
  { code: "11.1", band: "year", column: "it", ownerRole: "cto", status: "upcoming", prepared: true },
  { code: "7.1", band: "year", column: "it", ownerRole: "cto", status: "upcoming", prepared: true, frequency: "monthly" },
  { code: "6.1", band: "year", column: "operations", ownerRole: "coo", status: "done", dueInDays: 12 },
  { code: "8.1", band: "year", column: "operations", ownerRole: "coo", status: "done" },
  { code: "8.2", band: "year", column: "operations", ownerRole: "coo", status: "upcoming", prepared: true, legalRef: "Art. 21(2)(d)" },
  { code: "6.2", band: "year", column: "operations", ownerRole: "coo", status: "upcoming", prepared: true },

  // Lower priority — after that
  { code: "9.1", band: "later", column: "security", ownerRole: "ciso", status: "upcoming", prepared: true, frequency: "quarterly" },
  { code: "12.3", band: "later", column: "leadership", ownerRole: "ceo", status: "upcoming", prepared: true, frequency: "on-change" },
  { code: "12.4", band: "later", column: "leadership", ownerRole: "ceo", status: "upcoming" },
  { code: "5.2", band: "later", column: "it", ownerRole: "cto", status: "upcoming", prepared: true },
];

/** Build the FlowNode[] for a given locale's requirement titles. rawStatus is
 *  the real column: done->completed, current->in_progress, prepared->needs_review
 *  (auto-drafted, awaiting sign-off), otherwise not_started. */
export function buildSampleNodes(titles: Record<string, string>): FlowNode[] {
  return SEEDS.map((s, i) => {
    const rawStatus =
      s.status === "done"
        ? "completed"
        : s.status === "current"
          ? "in_progress"
          : s.prepared
            ? "needs_review"
            : "not_started";
    const node: FlowNode = {
      id: `sample-${i}`,
      code: s.code,
      label: titles[s.code] ?? s.code,
      categorySlug: s.code.split(".")[0],
      categoryCode: s.code.split(".")[0],
      band: s.band,
      column: s.column,
      ownerRole: s.ownerRole,
      status: s.status,
      rawStatus,
      isOverdue: s.dueInDays != null && s.dueInDays < 0,
      dueInDays: s.dueInDays ?? null,
      priority: s.priority ?? null,
      description: null,
      legalRef: s.legalRef ?? null,
      frequency: s.frequency ?? null,
      signOff: { signed: s.status === "done" ? 1 : 0, total: s.column === "leadership" ? 1 : 0 },
    };
    return node;
  });
}

export function sampleAggregate(nodes: FlowNode[]): Aggregate {
  const done = nodes.filter((n) => n.status === "done").length;
  return {
    total: nodes.length,
    done,
    awaitingSignoff: nodes.filter((n) => n.rawStatus === "needs_review").length,
    overdue: nodes.filter((n) => n.isOverdue).length,
    dueSoon: nodes.filter((n) => n.dueInDays != null && n.dueInDays >= 0 && n.dueInDays <= 30).length,
    open: nodes.length - done,
  };
}

export const SAMPLE_USER = {
  name: "Simon Orzel",
  email: "simon@nisd2.eu",
  image: null as string | null,
  isPlatformAdmin: false,
};

// Header counts derive from SEEDS so they cannot drift from the board aggregate
// (done = status "done", total = all seeds). The per-category breakdown is
// illustrative — categories do not map 1:1 to the SEEDS codes — but its
// completedCount values are kept summing to SAMPLE_DONE so an expanded sidebar
// stays consistent with the header and the board.
const SAMPLE_DONE = SEEDS.filter((s) => s.status === "done").length;
const SAMPLE_TOTAL = SEEDS.length;

// One NIS2 framework group for the sidebar. Category names only show when the
// group is expanded (collapsed by default), so they need no translation for the
// hero shot; the header count matches the board aggregate.
export const SAMPLE_FRAMEWORKS: FrameworkGroup[] = [
  {
    code: "NIS2",
    label: "nis2",
    codePrefix: "NIS2-",
    completed: SAMPLE_DONE,
    total: SAMPLE_TOTAL,
    steps: [
      { slug: "governance", code: "GOV", name: "Governance", phase: "phaseFoundation", requirementCount: 4, completedCount: 3, requirements: [] },
      { slug: "risk", code: "RSK", name: "Risikomanagement", phase: "phaseFoundation", requirementCount: 5, completedCount: 3, requirements: [] },
      { slug: "supply", code: "SUP", name: "Lieferkette", phase: "phaseFoundation", requirementCount: 3, completedCount: 1, requirements: [] },
      { slug: "crypto", code: "CRY", name: "Kryptografie", phase: "phaseControls", requirementCount: 2, completedCount: 2, requirements: [] },
      { slug: "access", code: "ACC", name: "Zugriffssteuerung", phase: "phaseControls", requirementCount: 3, completedCount: 1, requirements: [] },
      { slug: "incident", code: "INC", name: "Vorfallsbehandlung", phase: "phaseOperations", requirementCount: 3, completedCount: 1, requirements: [] },
      { slug: "training", code: "TRN", name: "Schulung", phase: "phaseVerification", requirementCount: 2, completedCount: 0, requirements: [] },
    ],
  },
];
