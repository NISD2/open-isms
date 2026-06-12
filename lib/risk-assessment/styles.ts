import type { Domain, Tier } from "./types";

type DomainVariant = "radarFill" | "radarDot" | "badge" | "pill";

const DOMAIN_STYLES: Record<Domain, Record<DomainVariant, string>> = {
  security: {
    radarFill: "fill-red-500/15 stroke-red-500",
    radarDot: "fill-red-500",
    badge: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30",
    pill: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30",
  },
  operational: {
    radarFill: "fill-amber-500/15 stroke-amber-500",
    radarDot: "fill-amber-500",
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
    pill: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
  },
  compliance: {
    radarFill: "fill-blue-500/15 stroke-blue-500",
    radarDot: "fill-blue-500",
    badge: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30",
    pill: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30",
  },
};

export function domainStyle(domain: Domain, variant: DomainVariant): string {
  return DOMAIN_STYLES[domain][variant];
}

const TIER_BADGE: Record<Tier, string> = {
  basis: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  standard: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  kern: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
};

export function tierBadgeStyle(tier: Tier): string {
  return TIER_BADGE[tier];
}
