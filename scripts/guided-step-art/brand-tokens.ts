import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { clampChroma, formatHex, oklch, parse } from "culori";
import postcss, { type ChildNode, type Declaration } from "postcss";
import {
  BRAND_COLORS,
  BRAND_MOTION,
  BRAND_TINTS,
  type BrandColor,
  type BrandRole,
  THEME_CSS,
} from "@/design/brand";

export interface Brand {
  colors: Record<BrandRole, string>;
  easing: string;
}

/** The light theme only: `:root` and the `@theme` block. `.dark` is a later concern. */
const isLightScope = (node: ChildNode): boolean =>
  (node.type === "rule" && node.selector === ":root") ||
  (node.type === "atrule" && node.name === "theme");

const customProperties = (node: ChildNode): Array<[string, string]> =>
  "nodes" in node && node.nodes
    ? node.nodes
        .filter((n): n is Declaration => n.type === "decl" && n.prop.startsWith("--"))
        .map((decl) => [decl.prop, decl.value])
    : [];

function tint(hex: string, lightness: number, chroma: number): string {
  const base = oklch(hex);
  if (!base) throw new Error(`Cannot read ${hex} as a colour`);
  return formatHex(clampChroma({ ...base, l: lightness, c: base.c * chroma }, "oklch"));
}

export async function loadBrand(repoRoot: string): Promise<Brand> {
  const css = postcss.parse(await readFile(join(repoRoot, THEME_CSS), "utf8"));
  const tokens = new Map(css.nodes.filter(isLightScope).flatMap(customProperties));

  const token = (prop: string): string => {
    const value = tokens.get(prop);
    if (!value) throw new Error(`${prop} is not defined in ${THEME_CSS}`);
    return value;
  };
  const colorToken = (prop: string): string => {
    const hex = formatHex(parse(token(prop)));
    if (!hex) throw new Error(`${prop} in ${THEME_CSS} is not a literal colour`);
    return hex;
  };

  const base = Object.fromEntries(
    Object.entries(BRAND_COLORS).map(([role, prop]) => [role, colorToken(prop)]),
  ) as Record<BrandColor, string>;
  const tints = Object.fromEntries(
    Object.entries(BRAND_TINTS).map(([role, t]) => [
      role,
      tint(base[t.base], t.lightness, t.chroma),
    ]),
  ) as Record<keyof typeof BRAND_TINTS, string>;

  return { colors: { ...base, ...tints }, easing: token(BRAND_MOTION.easing) };
}
