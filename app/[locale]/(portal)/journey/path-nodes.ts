import { nis2Categories } from "@nisd2/grc-data-model/frameworks";
import type { JourneyItem } from "./views";

export type NodeStatus = "done" | "current" | "upcoming";
export type ColumnKey = "leadership" | "security" | "it" | "operations";
export type Band = "minimum" | "year" | "later";
export type Density = "overview" | "critical" | "all";

/** A unified node the flow renders, whether it's a category or a requirement. */
export type FlowNode = {
  id: string;
  code: string; // "2.2" for a requirement, "RSK" for a category
  label: string;
  isReq: boolean;
  categorySlug: string;
  band: Band;
  column: ColumnKey;
  ownerRole: string;
  status: NodeStatus;
  priority: string | null;
  estimatedMinutes: number | null;
  completed: number;
  total: number;
};

/** Swimlane columns, in display order. */
export const COLUMNS: { key: ColumnKey; en: string; de: string }[] = [
  { key: "leadership", en: "Leadership", de: "Leitung" },
  { key: "security", en: "Security", de: "Sicherheit" },
  { key: "it", en: "IT", de: "IT" },
  { key: "operations", en: "Operations", de: "Betrieb" },
];

/** Criticality bands, top to bottom. */
export const BANDS: {
  key: Band;
  en: string;
  de: string;
  hintEn: string;
  hintDe: string;
}[] = [
  {
    key: "minimum",
    en: "Defensible minimum",
    de: "Belastbares Minimum",
    hintEn: "Do this first — what an auditor checks first",
    hintDe: "Zuerst erledigen — was ein Auditor zuerst prüft",
  },
  {
    key: "year",
    en: "Over the year",
    de: "Im Lauf des Jahres",
    hintEn: "Roughly 2 hours a week",
    hintDe: "Etwa 2 Stunden pro Woche",
  },
  {
    key: "later",
    en: "Lower priority",
    de: "Geringere Priorität",
    hintEn: "Once the rest is in place",
    hintDe: "Wenn der Rest steht",
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
  ceo: { en: "CEO", de: "Geschäftsführung" },
  legal: { en: "Legal", de: "Recht" },
  ciso: { en: "CISO", de: "CISO" },
  hr_director: { en: "HR", de: "HR" },
  cto: { en: "IT lead", de: "IT-Leitung" },
  coo: { en: "Operations", de: "Betrieb" },
  cpo: { en: "Procurement", de: "Einkauf" },
};

const CATEGORY_ROLE: Record<string, string> = Object.fromEntries(
  nis2Categories.map((c) => [c.code, c.relevantRoles?.[0] ?? "ciso"]),
);

const CATEGORY_ORDER: Record<string, number> = Object.fromEntries(
  nis2Categories.map((c) => [c.code, c.sortOrder]),
);

/**
 * True journey position. requirement.sortOrder is the requirement's index
 * WITHIN its category (0, 1, 2, ...), not a global order, so sorting by it
 * alone floats every category's first requirement to the top (e.g. MFA 11.1
 * ahead of assets 2.2). Order by the category sequence first, then the index.
 */
function globalOrder(item: JourneyItem): number {
  return (CATEGORY_ORDER[item.categoryCode] ?? 99) * 100 + item.sortOrder;
}

function columnFor(role: string): ColumnKey {
  return ROLE_COLUMN[role] ?? "security";
}

function bandForPriority(priority: string | null): Band {
  if (priority === "P0") return "minimum";
  if (priority === "P2" || priority === "P3") return "later";
  return "year"; // P1 and unset
}

function isDone(status: string): boolean {
  return status === "approved" || status === "not_applicable";
}

/** The single live node: lowest-order requirement not yet done. */
function liveCode(items: JourneyItem[]): string | null {
  return (
    [...items]
      .sort((a, b) => globalOrder(a) - globalOrder(b))
      .find((i) => !isDone(i.status))?.code ?? null
  );
}

/**
 * Category-level nodes (the 12 overview). A category sits in the
 * "defensible minimum" band if it carries any P0 requirement; otherwise it
 * falls to the yearly band. Status is linear: done when every requirement is
 * done, the lowest-order not-done category is current.
 */
export function buildCategoryNodes(items: JourneyItem[]): FlowNode[] {
  const agg = new Map<string, { total: number; done: number; hasP0: boolean }>();
  for (const it of items) {
    const a = agg.get(it.categoryCode) ?? { total: 0, done: 0, hasP0: false };
    a.total += 1;
    if (isDone(it.status)) a.done += 1;
    if (it.priority === "P0") a.hasP0 = true;
    agg.set(it.categoryCode, a);
  }

  const ordered = [...nis2Categories].sort((a, b) => a.sortOrder - b.sortOrder);
  let currentAssigned = false;

  return ordered.map((cat) => {
    const a = agg.get(cat.code) ?? { total: 0, done: 0, hasP0: false };
    const fullyDone = a.total > 0 && a.done === a.total;
    let status: NodeStatus;
    if (fullyDone) {
      status = "done";
    } else if (!currentAssigned) {
      status = "current";
      currentAssigned = true;
    } else {
      status = "upcoming";
    }
    const ownerRole = cat.relevantRoles?.[0] ?? "ciso";
    return {
      id: cat.code,
      code: cat.code,
      label: cat.name ?? cat.code,
      isReq: false,
      categorySlug: cat.slug ?? cat.code.toLowerCase(),
      band: a.hasP0 ? "minimum" : "year",
      column: columnFor(ownerRole),
      ownerRole,
      status,
      priority: a.hasP0 ? "P0" : "P1",
      estimatedMinutes: cat.estimatedMinutes,
      completed: a.done,
      total: a.total,
    };
  });
}

/**
 * Requirement-level nodes (all 49, coded like "2.2"). Banded by priority:
 * P0 to the defensible minimum, P1 to the yearly band, P2/P3 to lower. CEO
 * sign-off items move to the Leadership column regardless of category.
 */
export function buildRequirementNodes(items: JourneyItem[]): FlowNode[] {
  const live = liveCode(items);
  return [...items]
    .sort((a, b) => globalOrder(a) - globalOrder(b))
    .map((it) => {
      const ownerRole =
        it.requiredSignOffRole === "ceo"
          ? "ceo"
          : (CATEGORY_ROLE[it.categoryCode] ?? "ciso");
      const done = isDone(it.status);
      const status: NodeStatus = done
        ? "done"
        : it.code === live
          ? "current"
          : "upcoming";
      return {
        id: it.id,
        code: it.code,
        label: it.title,
        isReq: true,
        categorySlug: it.categorySlug,
        band: bandForPriority(it.priority),
        column: columnFor(ownerRole),
        ownerRole,
        status,
        priority: it.priority,
        estimatedMinutes: null,
        completed: done ? 1 : 0,
        total: 1,
      };
    });
}
