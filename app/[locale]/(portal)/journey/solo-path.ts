/**
 * Solo layout: the same 49 requirements as the swimlane, projected onto one
 * winding line instead of four role columns.
 *
 * A company where one person implements everything has no division of labour
 * for the columns to describe, so the only structure worth keeping is order.
 *
 * The order is by deadline: everything that belongs in month one, then the
 * first three months, then the rest of the first year. Inside a window the
 * categories run in process order, so the path reads as three blocks of work
 * rather than one list of 49.
 *
 * An earlier version ordered the whole path by process instead, arguing that
 * band order scatters progress. It does not: someone working this path works
 * down it, so progress is contiguous by construction — what scattered was the
 * sample data, which assumed the other order. Process order also put two
 * month-one steps at positions 32 and 34, telling the reader they were urgent
 * and then burying them.
 *
 * Nothing is filtered out and nothing is locked: these are legal duties, and
 * the sequence is a recommendation.
 */
import {
  BAND_RANK,
  BANDS,
  type Band,
  type FlowNode,
  ORDERED_CATEGORIES,
} from "./path-nodes";

/**
 * Stufen: the three deadline windows, read straight off the bands rather than
 * restated here. The band already carries both the "by when" and the sentence
 * under it, and a second copy is how the two views end up disagreeing about
 * what the middle window means — which is exactly what happened when this
 * file said "first 3 months" while the band said "over the year".
 */
function stageForBand(band: Band, de: boolean): SoloStage {
  const meta = BANDS.find((b) => b.key === band) ?? BANDS[1];
  return {
    index: BAND_RANK[band] + 1,
    band,
    label: de ? meta.phaseDe : meta.phaseEn,
    hint: de ? meta.hintDe : meta.hintEn,
  };
}

/**
 * Horizontal offsets in px, cycled over the global step index so the line
 * serpentines down the page instead of restarting at every section header.
 *
 * The period is four, and that is the whole point. It used to be eight
 * (0, 56, 88, 56, 0, -56, -88, -56), which has zero mean over a full cycle but
 * opens with its entire positive lobe. Only about four steps are ever visible
 * at once, on the landing hero and above the fold in the app, so the first
 * screenful caught that lobe and every node sat right of the section dividers.
 * It read as a centring bug rather than as motion. At period four any four
 * consecutive steps average to zero, so the path still weaves but stays on the
 * dividers' axis wherever you look at it.
 */
const WAVE = [0, 70, 0, -70] as const;

export type SoloStep = {
  node: FlowNode;
  /** 1-based position along the whole path, the "Schritt 7 von 49" number. */
  step: number;
  offsetPx: number;
};

export type SoloStage = {
  /** 1-based Stufe number. */
  index: number;
  band: Band;
  label: string;
  hint: string;
};

/** How many Stufen the path has, for the "Stufe 2 von 3" header. */
export const STAGE_COUNT = BANDS.length;

/** One stop on the vertical rail: a deadline window and how much is left. */
export type StageProgress = {
  index: number;
  band: Band;
  label: string;
  total: number;
  done: number;
  /** Steps not yet done. 0 means the window is cleared. */
  open: number;
};

/**
 * Per-window progress, in path order.
 *
 * Derived from the sections rather than recomputed from the nodes, so the rail
 * and the path cannot disagree about which window a step belongs to. Windows
 * the path never reaches simply do not appear.
 */
export function buildStageProgress(sections: SoloSection[]): StageProgress[] {
  return sections.reduce<StageProgress[]>((acc, section) => {
    const steps = section.steps;
    const done = steps.filter((s) => s.node.status === "done").length;
    const open = acc.at(-1);
    if (open?.index === section.stage.index) {
      open.total += steps.length;
      open.done += done;
      open.open += steps.length - done;
      return acc;
    }
    acc.push({
      index: section.stage.index,
      band: section.stage.band,
      label: section.stage.label,
      total: steps.length,
      done,
      open: steps.length - done,
    });
    return acc;
  }, []);
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

/**
 * Group the flow nodes into the sections the solo path renders.
 *
 * The incoming nodes are already in journey order, which is deadline first,
 * so sections fall out as the runs of consecutive nodes sharing a category
 * within one window, and stages as the runs of sections sharing a window. A
 * category that spans two windows appears once in each, which is correct: its
 * urgent steps genuinely belong to a different block of work than its rest.
 */
export function buildSoloSections(nodes: FlowNode[], de: boolean): SoloSection[] {
  const sections = nodes.reduce<SoloSection[]>((acc, node, i) => {
    const step: SoloStep = {
      node,
      step: i + 1,
      offsetPx: WAVE[i % WAVE.length],
    };
    const key = `${node.band}-${node.categoryCode}`;
    const open = acc.at(-1);
    if (open?.key === key) {
      open.steps.push(step);
      return acc;
    }
    const category = CATEGORY_BY_CODE.get(node.categoryCode);
    acc.push({
      key,
      stage: stageForBand(node.band, de),
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
