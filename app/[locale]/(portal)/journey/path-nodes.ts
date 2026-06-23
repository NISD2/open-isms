import { nis2Categories } from "@nisd2/grc-data-model/frameworks";
import type { JourneyItem } from "./views";

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
  isOverdue: boolean;
  priority: string | null;
  description: string | null;
  legalRef: string | null;
  frequency: string | null;
  /** Assigned sign-offs done vs required (N-of-M management sign-off). */
  signOff: { signed: number; total: number };
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
    infoEn: "Approves and is accountable. Signs off governance, budget and the duties under §38.",
    infoDe: "Genehmigt und verantwortet. Gibt Governance, Budget und die Pflichten nach §38 frei.",
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
    hintEn: "Do this first, what an auditor checks first",
    hintDe: "Zuerst erledigen, was ein Auditor zuerst prüft",
    phaseEn: "Month 1",
    phaseDe: "Monat 1",
  },
  {
    key: "year",
    en: "Over the year",
    de: "Im Lauf des Jahres",
    hintEn: "Roughly 2 hours a week",
    hintDe: "Etwa 2 Stunden pro Woche",
    phaseEn: "Next 3 months",
    phaseDe: "Nächste 3 Monate",
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
}[] = [...nis2Categories]
  .sort((a, b) => a.sortOrder - b.sortOrder)
  .map((c) => ({
    code: c.code,
    name: c.name ?? c.code,
    nameDe: CATEGORY_NAME_DE[c.code] ?? c.name ?? c.code,
    slug: c.slug ?? c.code.toLowerCase(),
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
 * True journey position. requirement.sortOrder is the requirement's index
 * WITHIN its category (0, 1, 2, ...), not a global order, so sorting by it
 * alone floats every category's first requirement to the top (e.g. MFA 11.1
 * ahead of assets 2.2). Order by the category sequence first, then the index.
 */
function globalOrder(item: JourneyItem): number {
  return (CATEGORY_ORDER[item.categoryCode] ?? 99) * 100 + item.sortOrder;
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

function bandForPriority(priority: string | null): Band {
  if (priority === "P0") return "minimum";
  if (priority === "P2" || priority === "P3") return "later";
  return "year"; // P1 and unset
}

function isDone(status: string): boolean {
  // "completed" is the normal user sign-off result; "approved" adds the legal
  // review. Both, plus not_applicable, are terminal.
  return (
    status === "completed" ||
    status === "approved" ||
    status === "not_applicable"
  );
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
 * Requirement-level nodes (all 49, coded like "2.2"), pre-sorted into the
 * canonical chronological (process) order. The flow re-groups them per the
 * active ordering. CEO sign-off items move to the Management column.
 */
export function buildRequirementNodes(items: JourneyItem[]): FlowNode[] {
  const live = liveCode(items);
  const now = Date.now();
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
      const dueMs = it.dueAt ? it.dueAt.getTime() : null;
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
        isOverdue: !done && dueMs !== null && dueMs < now,
        priority: it.priority,
        description: it.description,
        legalRef: it.legalRef,
        frequency: it.frequency,
        signOff: it.signOff,
      };
    });
}
