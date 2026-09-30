import type { BrandRole } from "./brand";

/**
 * The look of the Durchgang step illustrations. Every step is generated with this same
 * direction so the walk reads as one set. The palette is enforced twice: as Recraft's
 * colour control when generating, and by snapping every fill onto it afterwards, because
 * the model treats colours as a preference, not a rule.
 *
 * The direction follows the six parts Recraft's V4 guide asks a vector prompt to define,
 * and names concrete rules rather than moods. Large areas use the soft tints: the brand
 * blue next to charcoal read heavy and muddy. The backdrop disc is drawn by the script,
 * not requested from the model, which drew it as a thin ring in five of eight tries.
 */
export const GUIDED_STEP_ART = {
  model: "recraftv4_1_vector",
  size: "4:3",
  background: "surface",
  backdrop: { color: "primaryPale", radius: "31%" },
  palette: [
    ["primarySoft", "soft blue"],
    ["secondarySoft", "soft teal"],
    ["primary", "deep slate blue"],
    ["accent", "warm yellow"],
  ],
  direction: [
    "Graphic type: flat vector spot illustration with the clarity of an icon, instantly",
    "recognisable at small size.",
    "Subject: exactly one object and nothing else. No companion objects, no scenery, no",
    "ground line. The object is built from at most about ten large shapes, with clear gaps",
    "of white between its parts.",
    "Shape logic: circles, rounded rectangles and perfectly straight edges, every corner",
    "with the same small radius, symmetrical where the object is symmetrical.",
    "Straight-on front view: no perspective, no isometric angle, no depth.",
    "Line discipline: no outlines and no strokes. Shapes are separated by colour alone.",
    "Colour system: large areas in soft blue and soft teal, small details in deep slate",
    "blue, one small detail in warm yellow, white for paper. No black and no dark grey.",
    "Layout: the object centred, about 40 percent of the frame height, far from every",
    "edge. Plain white background with no circle or shape behind the object.",
    "Constraints: flat fills only, no gradients, shadows, textures, sparkles, motion lines",
    "or decorative dots.",
  ].join(" "),
  avoid: [
    "text, letters, numbers or logos anywhere",
    "people or faces",
    "padlocks, shields, hooded hackers, warning signs, alarms or other cyber cliches",
    "flags or national emblems",
  ],
  motion: {
    entranceMs: 700,
    staggerBudgetMs: 1400,
    staggerMaxMs: 40,
    riseUnits: 40,
    driftSeconds: 6,
    driftUnits: 16,
  },
} as const satisfies {
  background: BrandRole;
  backdrop: { color: BrandRole; radius: `${number}%` };
  palette: ReadonlyArray<readonly [BrandRole, string]>;
  [key: string]: unknown;
};

export type GuidedStepMotion = (typeof GUIDED_STEP_ART)["motion"];
