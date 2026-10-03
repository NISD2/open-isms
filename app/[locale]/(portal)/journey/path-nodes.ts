import { nis2Categories } from "@nisd2/grc-data-model/frameworks";
import {
  type DotState,
  isDoneState,
  journeyIndex,
  priorityRank,
} from "@/lib/compliance/journey-position";
import type { CoveredBy } from "@/lib/durchgang";
import { type JourneyItem, liveNode } from "./views";

export type { DotState };

export type NodeStatus = "done" | "current" | "upcoming";
export type ColumnKey = "leadership" | "security" | "it" | "operations";
export type Band = "minimum" | "year" | "later";
/** The two orderings the flow can show. Both render all steps. */
export type Order = "defensible" | "chrono";

/** A unified node the flow renders (one per requirement). */
export type FlowNode = {
  id: string;
  code: string; // "2.2"
  label: string;
  categorySlug: string;
  categoryCode: string;
  band: Band;
  column: ColumnKey;
  ownerRole: string;
  status: NodeStatus;
  /** Raw companyRequirementStatus, for the aggregate filter chips. */
  rawStatus: string;
  /** Where the requirement stands (`coveredState`); every view draws and labels from it. */
  state: DotState;
  /** What decided `state` when it was not work on the requirement itself, else null. */
  coveredBy: CoveredBy | null;
  /** Recurring-review cycle: the next review (nextReviewDate) is in the past. */
  isOverdue: boolean;
  /** Days until the next review (negative = overdue). null = no review date. */
  dueInDays: number | null;
  priority: string | null;
  description: string | null;
  legalRef: string | null;
  frequency: string | null;
  /** Index within the category, for re-deriving process order. */
  sortOrder: number;
  /** Assigned sign-offs done vs required (N-of-M management sign-off). */
  signOff: { signed: number; total: number };
};

/** Journey rollup counts. Single source of truth for the aggregate shape
 *  shared by the board, the preview sample data, and the journey router. */
export type Aggregate = {
  total: number;
  done: number;
  awaitingSignoff: number;
  overdue: number;
  dueSoon: number;
  open: number;
};

/** Swimlane columns, in display order. "Management" matches the §38 language. */
export const COLUMNS: {
  key: ColumnKey;
  en: string;
  de: string;
  infoEn: string;
  infoDe: string;
}[] = [
  {
    key: "leadership",
    en: "Management",
    de: "Geschäftsführung",
    infoEn:
      "Approves and is accountable. Signs off governance, budget and the duties under §38.",
    infoDe:
      "Genehmigt und verantwortet. Gibt Governance, Budget und die Pflichten nach §38 frei.",
  },
  {
    key: "security",
    en: "Security",
    de: "Sicherheit",
    infoEn: "Drives risk, incidents, access, training and effectiveness (CISO).",
    infoDe: "Steuert Risiko, Vorfälle, Zugriff, Schulung und Wirksamkeit (CISO).",
  },
  {
    key: "it",
    en: "IT",
    de: "IT",
    infoEn: "Implements technical controls: cryptography, patching, authentication.",
    infoDe: "Setzt technische Maßnahmen um: Kryptografie, Patches, Authentifizierung.",
  },
  {
    key: "operations",
    en: "Operations",
    de: "Betrieb",
    infoEn: "Owns continuity, backups and supplier management.",
    infoDe: "Verantwortet Kontinuität, Backups und Lieferantenmanagement.",
  },
];

/**
 * Criticality bands, top to bottom. Each maps to a rough phase so the path
 * reads as "you have time": the defensible minimum in month one, the rest
 * spread over the following months. It is NOT all due in two weeks.
 */
export const BANDS: {
  key: Band;
  en: string;
  de: string;
  hintEn: string;
  hintDe: string;
  phaseEn: string;
  phaseDe: string;
}[] = [
  {
    key: "minimum",
    en: "Defensible minimum",
    de: "Belastbares Minimum",
    hintEn: "The mandatory, foundational controls",
    hintDe: "Die verpflichtenden, grundlegenden Maßnahmen",
    phaseEn: "In the first month",
    phaseDe: "Im ersten Monat",
  },
  {
    key: "year",
    en: "Over the year",
    de: "Im Lauf des Jahres",
    hintEn: "The remaining measures, step by step",
    hintDe: "Die übrigen Maßnahmen, Schritt für Schritt",
    phaseEn: "In the first year",
    phaseDe: "Im ersten Jahr",
  },
  {
    key: "later",
    en: "Lower priority",
    de: "Geringere Priorität",
    hintEn: "Once the rest is in place",
    hintDe: "Wenn der Rest steht",
    phaseEn: "After that",
    phaseDe: "Danach",
  },
];

const ROLE_COLUMN: Record<string, ColumnKey> = {
  ceo: "leadership",
  legal: "leadership",
  ciso: "security",
  hr_director: "security",
  cto: "it",
  coo: "operations",
  cpo: "operations",
};

export const ROLE_LABEL: Record<string, { en: string; de: string }> = {
  ceo: { en: "Management", de: "Geschäftsführung" },
  legal: { en: "Legal", de: "Recht" },
  ciso: { en: "CISO", de: "CISO" },
  hr_director: { en: "HR", de: "HR" },
  cto: { en: "IT lead", de: "IT-Leitung" },
  coo: { en: "Operations", de: "Betrieb" },
  cpo: { en: "Procurement", de: "Einkauf" },
};

/** German display names for the 12 NIS2 categories (chrono section headers). */
const CATEGORY_NAME_DE: Record<string, string> = {
  GOV: "Governance",
  RSK: "Risikomanagement",
  INC: "Vorfallsbehandlung",
  BCP: "Geschäftskontinuität",
  SUP: "Lieferanten und Lieferkette",
  PRO: "Patches und Schwachstellen",
  EFF: "Wirksamkeitsprüfung",
  TRN: "Schulung",
  CRY: "Kryptografie",
  ACC: "Zugriffssteuerung",
  AUT: "Authentifizierung",
  REG: "Registrierung",
};

/** Categories in process order, for the chronological view's group headers. */
export const ORDERED_CATEGORIES: {
  code: string;
  name: string;
  nameDe: string;
  slug: string;
  sortOrder: number;
}[] = [...nis2Categories]
  .sort((a, b) => a.sortOrder - b.sortOrder)
  .map((c) => ({
    code: c.code,
    name: c.name ?? c.code,
    nameDe: CATEGORY_NAME_DE[c.code] ?? c.name ?? c.code,
    slug: c.slug ?? c.code.toLowerCase(),
    sortOrder: c.sortOrder,
  }));

/** Localized human labels for requirement.frequency slugs. */
export const FREQUENCY_LABEL: Record<string, { en: string; de: string }> = {
  annual: { en: "Annual", de: "Jährlich" },
  quarterly: { en: "Quarterly", de: "Vierteljährlich" },
  monthly: { en: "Monthly", de: "Monatlich" },
  "every-3-years": { en: "Every 3 years", de: "Alle 3 Jahre" },
  "on-change": { en: "On change", de: "Bei Änderung" },
  "one-time": { en: "One-time", de: "Einmalig" },
  ongoing: { en: "Ongoing", de: "Laufend" },
};

const CATEGORY_ROLE: Record<string, string> = Object.fromEntries(
  nis2Categories.map((c) => [c.code, c.relevantRoles?.[0] ?? "ciso"]),
);

const CATEGORY_ORDER: Record<string, number> = Object.fromEntries(
  nis2Categories.map((c) => [c.code, c.sortOrder]),
);

/**
 * True journey position: the shared urgency-then-process order.
 *
 * Read from the canonical helper rather than restated here, because the
 * guided path, the swimlane banner, the activation nudge and the digest are
 * only ever consistent while they read the same function.
 */
function globalOrder(item: JourneyItem): number {
  return journeyIndex(item.code);
}

/**
 * Process order: the category sequence, then the index within it, ignoring
 * urgency. Journey order leads with criticality, so the swimlane's
 * chronological mode has to re-sort rather than take the incoming order —
 * without this its row numbers ran 1, 9, 23 inside a single category.
 */
export function processOrder(node: Pick<FlowNode, "categoryCode" | "sortOrder">): number {
  return (CATEGORY_ORDER[node.categoryCode] ?? 99) * 100 + node.sortOrder;
}

/** Band display rank, for the defensible-minimum ordering. */
export const BAND_RANK: Record<Band, number> = {
  minimum: 0,
  year: 1,
  later: 2,
};

function columnFor(role: string): ColumnKey {
  return ROLE_COLUMN[role] ?? "security";
}

/** Where a requirement node links to. One definition for every journey view. */
export function requirementHref(node: Pick<FlowNode, "categorySlug" | "code">) {
  return {
    pathname: "/compliance/[categorySlug]/[requirementCode]" as const,
    params: { categorySlug: node.categorySlug, requirementCode: node.code },
  };
}

/**
 * The call to action on the live step: whether work has already begun on it, or only the
 * sign-off is left. The hero, the pinned bar and the pill over the node all say this, and must
 * agree.
 */
export function startLabel(state: DotState, de: boolean): string {
  if (state === "awaiting") return de ? "Freigeben" : "Sign off";
  if (state === "started") return de ? "Weiter" : "Continue";
  return de ? "Anfangen" : "Start";
}

/** Tailwind text colour for a state, so a status reads the same in every view. */
export function statusTone(state: DotState): string {
  if (state === "signed") return "text-primary";
  if (state === "awaiting") return "text-amber-600 dark:text-amber-400";
  if (state === "rejected") return "text-destructive";
  return "text-muted-foreground";
}

/** Localized requirement.frequency, falling back to the raw slug. */
export function frequencyLabel(frequency: string | null, de: boolean): string | null {
  if (!frequency) return null;
  const label = FREQUENCY_LABEL[frequency];
  if (!label) return frequency;
  return de ? label.de : label.en;
}

/**
 * Localized recurring-review clock, or null where there is no review date.
 *
 * Only ever called with the server-computed `dueInDays`, which is gated to
 * review statuses: a never-done item carries an initial implementation
 * deadline, and calling that a late review would be wrong.
 */
export function reviewLabel(dueInDays: number | null, de: boolean): string | null {
  if (dueInDays === null) return null;
  if (dueInDays < 0) {
    const days = -dueInDays;
    return de
      ? `Prüfung ${days} ${days === 1 ? "Tag" : "Tage"} überfällig`
      : `Review ${days} ${days === 1 ? "day" : "days"} overdue`;
  }
  if (dueInDays === 0) return de ? "Prüfung heute fällig" : "Review due today";
  return de
    ? `Nächste Prüfung in ${dueInDays} ${dueInDays === 1 ? "Tag" : "Tagen"}`
    : `Next review in ${dueInDays} ${dueInDays === 1 ? "day" : "days"}`;
}

/**
 * Localized status wording. One vocabulary so the views cannot drift apart. The raw status only
 * tells a signature from a reviewer's approval; everything else is the node's state, and where
 * the state came from the walk or from no statute asking for it, the label says so.
 */
export function statusLabel(
  node: Pick<FlowNode, "rawStatus" | "state" | "coveredBy">,
  de: boolean,
): string {
  const { coveredBy } = node;
  if (coveredBy?.kind === "not_required") {
    return de ? "Gesetzlich nicht gefordert" : "Not required by law";
  }
  if (coveredBy?.kind === "walk") {
    const codes = coveredBy.codes.join(de ? " und " : " and ");
    return node.state === "signed"
      ? de
        ? `Im Durchgang mit ${codes} freigegeben`
        : `Signed off in the walkthrough with ${codes}`
      : de
        ? `Im Durchgang mit ${codes}, wartet auf Freigabe`
        : `In the walkthrough with ${codes}, awaiting sign-off`;
  }
  switch (node.state) {
    case "signed":
      if (node.rawStatus === "approved") return de ? "Geprüft" : "Reviewed";
      return de ? "Freigegeben" : "Signed off";
    case "na":
      return de ? "Nicht zutreffend" : "Not applicable";
    case "awaiting":
      return de ? "Wartet auf Freigabe" : "Awaiting sign-off";
    case "started":
      return de ? "In Arbeit" : "In progress";
    case "rejected":
      return de ? "Abgelehnt" : "Rejected";
    case "todo":
      return de ? "Offen" : "Open";
  }
}

/** The band a priority falls in, off the one priority-to-tier mapping. */
function bandForPriority(priority: string | null): Band {
  return (["minimum", "year", "later"] as const)[priorityRank(priority)];
}

/**
 * Requirement-level nodes (all 49, coded like "2.2"), pre-sorted into the
 * canonical chronological (process) order. The flow re-groups them per the
 * active ordering. CEO sign-off items move to the Management column.
 */
export function buildRequirementNodes(items: JourneyItem[]): FlowNode[] {
  const live = liveNode(items)?.code ?? null;
  return [...items]
    .sort((a, b) => globalOrder(a) - globalOrder(b))
    .map((it) => {
      const ownerRole =
        it.requiredSignOffRole === "ceo"
          ? "ceo"
          : (CATEGORY_ROLE[it.categoryCode] ?? "ciso");
      const done = isDoneState(it.state);
      const status: NodeStatus = done
        ? "done"
        : it.code === live
          ? "current"
          : "upcoming";
      return {
        id: it.id,
        code: it.code,
        label: it.title,
        categorySlug: it.categorySlug,
        categoryCode: it.categoryCode,
        band: bandForPriority(it.priority),
        column: columnFor(ownerRole),
        ownerRole,
        status,
        rawStatus: it.status,
        state: it.state,
        coveredBy: it.coveredBy,
        // Recurring review (server-computed, calendar days, review-status-gated).
        isOverdue: it.dueInDays !== null && it.dueInDays < 0,
        dueInDays: it.dueInDays,
        priority: it.priority,
        description: it.description,
        legalRef: it.legalRef,
        frequency: it.frequency,
        sortOrder: it.sortOrder,
        signOff: it.signOff,
      };
    });
}
