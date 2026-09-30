import { converter } from "culori";
import { GUIDED_STEP_ART } from "@/design/guided-step-art";
import type { Brand } from "./brand-tokens";

const toRgb = converter("rgb");

const rgbTriple = (hex: string) => {
  const rgb = toRgb(hex);
  if (!rgb) throw new Error(`Cannot read ${hex} as a colour`);
  const channel = (value: number) => Math.round(value * 255);
  return [channel(rgb.r), channel(rgb.g), channel(rgb.b)] as const;
};

const paletteHexes = (brand: Brand) =>
  GUIDED_STEP_ART.palette.map(([role]) => brand.colors[role]);

/** The subject leads, because the model weighs early words most. The theme follows. */
export function composePrompt(subject: string, brand: Brand): string {
  const colours = GUIDED_STEP_ART.palette
    .map(([role, name]) => `${name} ${brand.colors[role]}`)
    .join(", ");
  return [
    subject.trim(),
    GUIDED_STEP_ART.direction,
    `Colours: ${colours}.`,
    `Avoid: ${GUIDED_STEP_ART.avoid.join("; ")}.`,
  ].join("\n\n");
}

/** Every colour the finished file may contain: palette, background and backdrop. */
export const allowedColors = (brand: Brand): string[] => [
  ...paletteHexes(brand),
  brand.colors[GUIDED_STEP_ART.background],
  brand.colors[GUIDED_STEP_ART.backdrop.color],
];

export function recraftRequest(subject: string, brand: Brand) {
  return {
    prompt: composePrompt(subject, brand),
    model: GUIDED_STEP_ART.model,
    size: GUIDED_STEP_ART.size,
    n: 1,
    response_format: "url",
    controls: {
      colors: paletteHexes(brand).map((hex) => ({ rgb: rgbTriple(hex) })),
      background_color: { rgb: rgbTriple(brand.colors[GUIDED_STEP_ART.background]) },
    },
  } as const;
}

export type RecraftRequest = ReturnType<typeof recraftRequest>;
