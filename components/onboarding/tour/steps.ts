/**
 * What the guided tour points at, per page.
 *
 * Steps address the page through `data-tour` attributes rather than element
 * ids. An id is a document-wide name that anything may collide with and that
 * a later refactor will happily delete as unused; `data-tour` reads as what it
 * is, instrumentation for this file, and survives two instances of the same
 * component on one screen.
 */
export type TourStep = {
  /**
   * Matches the `data-tour` attribute on the element to highlight. Omitted for
   * an establishing step, which dims the whole screen and centres its card
   * instead of spotlighting one element.
   */
  target?: string;
  /** Key under `guide.tour.steps`. `.title` and `.body` hang off it. */
  key: string;
  /** Which side of the target the card prefers. Radix flips it on collision. */
  side?: "top" | "right" | "bottom" | "left";
};

/**
 * Establish the whole board, narrow to what a single row is, then explain the
 * controls, then hand over to the rest of the portal.
 *
 * The opening step has no target on purpose. Spotlighting the board means
 * spotlighting nearly the whole viewport, which leaves the card nowhere to sit
 * and reads as a highlight of nothing in particular. Dimming everything and
 * centring the card says "here is the thing you are looking at" without
 * pretending to point at a detail.
 *
 * `firstStep` sits on a full-width row, so it prefers bottom rather than a
 * horizontal side: there is no room beside a row that spans the content
 * column, and Radix shifting a colliding card is what made it look clipped.
 */
const JOURNEY_STEPS: readonly TourStep[] = [
  { key: "overview" },
  { target: "journey-first-step", key: "firstStep", side: "bottom" },
  { target: "journey-order", key: "order", side: "bottom" },
  { target: "journey-filters", key: "filters", side: "bottom" },
  { target: "journey-legend", key: "legend", side: "left" },
  { target: "sidebar-nav", key: "sidebar", side: "right" },
  { target: "sidebar-registers", key: "registers", side: "right" },
];

const REQUIREMENT_STEPS: readonly TourStep[] = [
  { target: "requirement-status", key: "status", side: "bottom" },
  { target: "requirement-form", key: "form", side: "top" },
  { target: "requirement-evidence", key: "evidence", side: "top" },
  { target: "requirement-assign", key: "assign", side: "left" },
  { target: "requirement-nav", key: "nav", side: "top" },
];

/**
 * The tour for a locale-stripped portal path, or null where none is defined.
 *
 * Steps whose target is absent on the page are dropped before the tour runs
 * (see PortalGuide), so a page may legitimately carry only some of these.
 */
export function tourForPath(path: string): readonly TourStep[] | null {
  const segments = path.split("/").filter(Boolean);
  if (segments[0] === "journey") return JOURNEY_STEPS;
  // /compliance/<category>/<requirement>. The category index is a link list
  // with nothing to explain, so only the three-segment detail page tours.
  if (segments[0] === "compliance" && segments.length === 3) {
    return REQUIREMENT_STEPS;
  }
  return null;
}
