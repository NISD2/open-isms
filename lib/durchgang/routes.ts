import type { WalkFramework } from "./types";

/**
 * Each walk's pages, by framework: its home, one item, management's approval, and setting the
 * company up as a step. The pathnames are the typed ones of i18n/routing.ts, so a link built from
 * here is checked like a literal one.
 */
export const WALK_ROUTES = {
  nis2: {
    home: "/durchgang/nis2",
    item: "/durchgang/nis2/[code]",
    approval: "/durchgang/nis2/freigabe",
    setup: "/durchgang/nis2/unternehmen",
  },
} as const satisfies Record<
  WalkFramework,
  { home: string; item: string; approval: string; setup: string }
>;

/** Where one item of a walk opens, at one of its screens if given. */
export const itemHref = (framework: WalkFramework, code: string, screen?: number) =>
  ({
    pathname: WALK_ROUTES[framework].item,
    params: { code },
    ...(screen === undefined ? {} : { query: { s: String(screen) } }),
  }) as const;
