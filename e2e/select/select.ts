import {
  ALWAYS,
  type Area,
  FULL_LABEL,
  NEEDS_TENANT_DATA,
  PATH_AREAS,
  RUNS_ALL,
  SPEC_AREAS,
  TENANT_DATA,
} from "./areas";

/** What a pull request runs: the whole suite and why, or these specs for these areas. */
export type Selection =
  | { readonly kind: "all"; readonly because: string }
  | {
      readonly kind: "some";
      readonly areas: readonly Area[];
      readonly specs: readonly string[];
    };

/** The areas one changed path belongs to, or null when no entry claims it. */
export const areasOf = (path: string): readonly Area[] | null => {
  if (RUNS_ALL.includes(path)) return null;
  const own = SPEC_AREAS[path];
  if (own === "full") return null;
  if (own) return own;
  const longest = PATH_AREAS.filter(([prefix]) => path.startsWith(prefix)).sort(
    (a, b) => b[0].length - a[0].length,
  )[0];
  return longest ? longest[1] : null;
};

/**
 * The browser specs a change needs. Anything no entry claims, and the `e2e:full` label, run the
 * whole suite; otherwise the specs of the touched areas, after sign-in and the smoke check, with
 * the tenant's data first where an area reads it. Playwright keeps file order, so the layers stay
 * in their order.
 */
export const selectSpecs = (
  changed: readonly string[],
  labels: readonly string[],
): Selection => {
  if (labels.includes(FULL_LABEL)) {
    return { kind: "all", because: `the PR has the ${FULL_LABEL} label` };
  }
  const unclaimed = changed.find((path) => areasOf(path) === null);
  if (unclaimed !== undefined) {
    return { kind: "all", because: `${unclaimed} is not one area's` };
  }
  const areas = [...new Set(changed.flatMap((path) => areasOf(path) ?? []))].sort();
  const specs = Object.entries(SPEC_AREAS).flatMap(([spec, of]) =>
    of !== "full" && of.some((area) => areas.includes(area)) ? [spec] : [],
  );
  const data = areas.some((area) => NEEDS_TENANT_DATA.includes(area)) ? TENANT_DATA : [];
  return { kind: "some", areas, specs: [...ALWAYS, ...data, ...specs].sort() };
};
