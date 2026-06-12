import type { Absicherungsvariante, Schutzbedarf } from "./types";

// Colour palette shared by the radar fill, the friendly tier badge,
// and the per-Grundwert Schutzbedarf badges in the audit panel.
//
//   normal / basis    → emerald (green)
//   hoch / standard   → amber   (yellow-orange)
//   sehrHoch / kern   → red     (high-attention)

const VARIANTE_BADGE: Record<Absicherungsvariante, string> = {
  basis:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  standard:
    "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  kern: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
};

export function varianteBadgeStyle(v: Absicherungsvariante): string {
  return VARIANTE_BADGE[v];
}

const SCHUTZBEDARF_BADGE: Record<Schutzbedarf, string> = {
  normal:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  hoch: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  sehrHoch:
    "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
};

export function schutzbedarfBadgeStyle(s: Schutzbedarf): string {
  return SCHUTZBEDARF_BADGE[s];
}
