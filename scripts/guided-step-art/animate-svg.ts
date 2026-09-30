import { DOMParser, type Element, type Node, XMLSerializer } from "@xmldom/xmldom";
import { differenceCiede2000, nearest, parse } from "culori";
import type { GuidedStepMotion } from "@/design/guided-step-art";

const SVG_NS = "http://www.w3.org/2000/svg";
const SHAPES = new Set([
  "path",
  "rect",
  "circle",
  "ellipse",
  "polygon",
  "polyline",
  "line",
]);
/** Children that describe the file rather than draw it; they stay outside the moving group. */
const NON_DRAWING = new Set(["metadata", "defs", "style", "title", "desc"]);
const PAINT_ATTRIBUTES = ["fill", "stroke"] as const;

export interface AnimateOptions {
  /** Every colour the result may contain, as hex. The first-listed wins a tie. */
  palette: readonly string[];
  /** The colour of the background shape Recraft always paints first. */
  background: string;
  /** A disc drawn behind every picture, the same in each, so a set reads as one. */
  backdrop: { color: string; radius: string };
  easing: string;
  motion: GuidedStepMotion;
}

const isElement = (node: Node): node is Element => node.nodeType === node.ELEMENT_NODE;

function appendAttribute(el: Element, name: string, value: string, separator: string) {
  const existing = el.getAttribute(name);
  el.setAttribute(name, existing ? `${existing}${separator}${value}` : value);
}

function paletteSnapper(palette: readonly string[]) {
  const entries = palette.flatMap((hex) => {
    const color = parse(hex);
    return color ? [{ hex, color }] : [];
  });
  const closest = nearest(entries, differenceCiede2000(), (entry) => entry.color);
  return (value: string): string | null => {
    const color = parse(value);
    if (!color) return null;
    const [match] = closest(color, 1);
    return match?.hex ?? null;
  };
}

function motionCss(options: AnimateOptions, shapeCount: number): string {
  const { motion, easing } = options;
  const stagger = Math.min(motion.staggerMaxMs, motion.staggerBudgetMs / shapeCount);
  const settled = Math.round(stagger * shapeCount + motion.entranceMs);
  return [
    `.rise{animation:rise ${motion.entranceMs}ms ${easing} both;`,
    `animation-delay:calc(var(--i) * ${stagger.toFixed(1)}ms)}`,
    `@keyframes rise{from{opacity:0;translate:0 ${motion.riseUnits}px}to{opacity:1;translate:none}}`,
    `.drift{animation:drift ${motion.driftSeconds}s ease-in-out ${settled}ms infinite}`,
    `@keyframes drift{50%{translate:0 -${motion.driftUnits}px}}`,
    "@media (prefers-reduced-motion:reduce){.rise,.drift{animation:none}}",
  ].join("");
}

/**
 * Puts a Recraft SVG into the brand palette and gives it an entrance: the shapes fade up
 * in paint order, which is back to front, so the scene assembles itself; then the whole
 * picture drifts slowly. `translate` is animated rather than `transform`, so the shapes'
 * own transform attributes keep working. The resting state is fully drawn: only the
 * animation hides a shape, so wherever animations do not run the picture still shows.
 */
export function animateSvg(svgText: string, options: AnimateOptions): string {
  const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
  const root = doc.documentElement;
  if (root?.localName !== "svg") throw new Error("The input is not an SVG document");

  const snap = paletteSnapper(options.palette);
  const shapes = Array.from(root.getElementsByTagName("*")).filter((el) =>
    SHAPES.has(el.localName ?? ""),
  );
  for (const shape of shapes) {
    for (const attribute of PAINT_ATTRIBUTES) {
      const snapped = snap(shape.getAttribute(attribute) ?? "");
      if (snapped) shape.setAttribute(attribute, snapped);
    }
  }

  const [first] = shapes;
  const background =
    first &&
    first.parentNode === root &&
    first.getAttribute("fill") === options.background
      ? first
      : null;

  const drawing = Array.from(root.childNodes)
    .filter(isElement)
    .filter((el) => el !== background && !NON_DRAWING.has(el.localName ?? ""));
  const disc = doc.createElementNS(SVG_NS, "circle");
  disc.setAttribute("cx", "50%");
  disc.setAttribute("cy", "50%");
  disc.setAttribute("r", options.backdrop.radius);
  disc.setAttribute("fill", options.backdrop.color);
  root.appendChild(disc);

  const drift = doc.createElementNS(SVG_NS, "g");
  drift.setAttribute("class", "drift");
  for (const el of drawing) drift.appendChild(el);
  root.appendChild(drift);

  const moving = shapes.filter((shape) => shape !== background);
  moving.forEach((shape, index) => {
    appendAttribute(shape, "class", "rise", " ");
    appendAttribute(shape, "style", `--i:${index}`, ";");
  });

  const style = doc.createElementNS(SVG_NS, "style");
  style.appendChild(doc.createTextNode(motionCss(options, moving.length)));
  root.insertBefore(style, root.firstChild);
  root.removeAttribute("preserveAspectRatio");

  return new XMLSerializer().serializeToString(doc);
}
