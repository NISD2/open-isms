/**
 * Solo layout: the same 49 requirements as the swimlane, projected onto one
 * winding line instead of four role columns.
 *
 * A company where one person implements everything has no division of labour
 * for the columns to describe, so the only structure worth keeping is order.
 *
 * That order is the chronological one, deliberately, and not the criticality
 * bands the team view opens with. The bands scatter a category across stages
 * (registration P0 items land in stage one, the rest of registration in stage
 * two), so progress stops being contiguous and the one live step sinks into
 * the middle of the page — which defeats a guided path. Chronological is also
 * the order `liveNode` already computes "next" in, so what the path shows and
 * what the platform recommends are the same sequence. Criticality survives as
 * a badge on the eight P0 steps rather than as a reordering.
 *
 * Nothing is filtered out and nothing is locked: these are legal duties, and
 * the sequence is a recommendation.
 */
import { type Band, type FlowNode, ORDERED_CATEGORIES } from "./path-nodes";

/**
 * Deadline horizons, phrased short enough for the rail.
 *
 * The same three criticality bands the team view groups by, said as a "by
 * when" rather than as a rank, because that is the question the rail answers.
 * Kept here rather than read from BANDS: those strings are section headers
 * ("Nächste 3 Monate") and do not fit after a count.
 */
const DUE_LABEL: Record<Band, { de: string; en: string }> = {
  minimum: { de: "in Monat 1", en: "in month 1" },
  year: { de: "in 3 Monaten", en: "in 3 months" },
  later: { de: "später", en: "later" },
};

const BAND_URGENCY: Band[] = ["minimum", "year", "later"];

/**
 * Horizontal offsets in px, cycled over the global step index so the line
 * serpentines continuously down the page instead of restarting at every
 * section header. Mirrors the reference spacing (0, ±44, ±70).
 */
const WAVE = [0, 56, 88, 56, 0, -56, -88, -56] as const;

/**
 * Stufen. The boundaries are category sortOrder ranges, and they are the same
 * grouping the portal sidebar renders (REG | GOV RSK SUP | CRY ACC AUT | PRO
 * INC BCP | TRN EFF), so the two navigations tell the same story.
 */
const PHASES = [
  {
    maxSortOrder: 0,
    de: "Registrierung",
    en: "Registration",
    hintDe: "Feststellen, ob und wo Sie registriert sein müssen.",
    hintEn: "Establish whether and where you have to register.",
  },
  {
    maxSortOrder: 3,
    de: "Grundlagen",
    en: "Foundation",
    hintDe: "Verantwortung, Risiken, Werte und Lieferanten festlegen.",
    hintEn: "Set responsibility, risk, assets and suppliers.",
  },
  {
    maxSortOrder: 6,
    de: "Schutzmaßnahmen",
    en: "Controls",
    hintDe: "Verschlüsselung, Zugriff und Authentifizierung.",
    hintEn: "Encryption, access and authentication.",
  },
  {
    maxSortOrder: 9,
    de: "Betrieb",
    en: "Operations",
    hintDe: "Patches, Vorfälle und Wiederanlauf.",
    hintEn: "Patching, incidents and recovery.",
  },
  {
    maxSortOrder: 99,
    de: "Nachweis",
    en: "Verification",
    hintDe: "Schulung und der Nachweis, dass es wirkt.",
    hintEn: "Training, and the proof that it works.",
  },
] as const;

export type SoloStep = {
  node: FlowNode;
  /** 1-based position along the whole path, the "Schritt 7 von 49" number. */
  step: number;
  offsetPx: number;
  /** A P0 step: part of the defensible minimum, so it carries a badge. */
  isMinimum: boolean;
};

export type SoloStage = {
  /** 1-based Stufe number. */
  index: number;
  label: string;
  hint: string;
};

/** How many Stufen the path has, for the "Stufe 2 von 5" header. */
export const STAGE_COUNT = PHASES.length;

/**
 * One stop on the vertical rail: a stage, how far through it you are, and the
 * soonest its contents are due.
 *
 * The due figure is the count of steps in the most urgent band the stage
 * holds, not a deadline for the stage itself. A stage is not a deadline
 * bucket — month-one steps sit in four of the five — so "this stage is due in
 * month 1" would be false for most of what it contains. "Three of these
 * cannot wait past month one" is both true and the thing worth acting on.
 */
export type StageProgress = {
  index: number;
  label: string;
  total: number;
  done: number;
  /** Steps in the soonest band this stage holds; 0 when every step is done. */
  dueCount: number;
  /** Localized horizon for those steps, or null when there are none left. */
  dueLabel: string | null;
};

function soonestDue(
  steps: SoloStep[],
  de: boolean,
): { dueCount: number; dueLabel: string | null } {
  const open = steps.filter((s) => s.node.status !== "done");
  const band = BAND_URGENCY.find((b) => open.some((s) => s.node.band === b));
  if (!band) return { dueCount: 0, dueLabel: null };
  return {
    dueCount: open.filter((s) => s.node.band === band).length,
    dueLabel: de ? DUE_LABEL[band].de : DUE_LABEL[band].en,
  };
}

/**
 * Per-stage progress, in path order.
 *
 * Derived from the sections rather than recomputed from the nodes, so the rail
 * and the path cannot disagree about which stage a step belongs to. Stages the
 * path never reaches simply do not appear.
 */
export function buildStageProgress(
  sections: SoloSection[],
  de: boolean,
): StageProgress[] {
  const byStage = sections.reduce<Map<number, { label: string; steps: SoloStep[] }>>(
    (acc, section) => {
      const open = acc.get(section.stage.index);
      if (open) open.steps.push(...section.steps);
      else
        acc.set(section.stage.index, {
          label: section.stage.label,
          steps: [...section.steps],
        });
      return acc;
    },
    new Map(),
  );

  return [...byStage.entries()].map(([index, { label, steps }]) => ({
    index,
    label,
    total: steps.length,
    done: steps.filter((s) => s.node.status === "done").length,
    ...soonestDue(steps, de),
  }));
}

export type SoloSection = {
  key: string;
  stage: SoloStage;
  /** Category name — the "Abschnitt" line. */
  title: string;
  categorySlug: string;
  steps: SoloStep[];
  /** Set on the last section of a stage: what comes after it. null = the end. */
  nextStage: (SoloStage & { steps: number }) | null;
};

const CATEGORY_BY_CODE = new Map(ORDERED_CATEGORIES.map((c) => [c.code, c]));

function phaseIndexFor(categorySortOrder: number): number {
  const found = PHASES.findIndex((p) => categorySortOrder <= p.maxSortOrder);
  return found === -1 ? PHASES.length - 1 : found;
}

function stageAt(index: number, de: boolean): SoloStage {
  const phase = PHASES[index];
  return {
    index: index + 1,
    label: de ? phase.de : phase.en,
    hint: de ? phase.hintDe : phase.hintEn,
  };
}

/**
 * Group the flow nodes into the sections the solo path renders.
 *
 * The incoming nodes are already in global process order, so sections fall out
 * as the runs of consecutive nodes sharing a category, and stages as the runs
 * of consecutive sections sharing a phase.
 */
export function buildSoloSections(nodes: FlowNode[], de: boolean): SoloSection[] {
  const sections = nodes.reduce<SoloSection[]>((acc, node, i) => {
    const step: SoloStep = {
      node,
      step: i + 1,
      offsetPx: WAVE[i % WAVE.length],
      isMinimum: node.band === "minimum",
    };
    const open = acc.at(-1);
    if (open?.key === node.categoryCode) {
      open.steps.push(step);
      return acc;
    }
    const category = CATEGORY_BY_CODE.get(node.categoryCode);
    acc.push({
      key: node.categoryCode,
      stage: stageAt(phaseIndexFor(category?.sortOrder ?? 99), de),
      title: (de ? category?.nameDe : category?.name) ?? node.categoryCode,
      categorySlug: node.categorySlug,
      steps: [step],
      nextStage: null,
    });
    return acc;
  }, []);

  // A section closes a stage when the next one belongs to a different stage.
  // Compared through stage.index rather than a second phase field on the
  // section: the stage is already the answer, and storing it twice is one
  // more thing that can disagree with itself.
  return sections.map((section, i) => {
    const next = sections[i + 1];
    if (!next || next.stage.index === section.stage.index) return section;
    const stepsInNext = sections
      .filter((s) => s.stage.index === next.stage.index)
      .reduce((sum, s) => sum + s.steps.length, 0);
    return { ...section, nextStage: { ...next.stage, steps: stepsInNext } };
  });
}
