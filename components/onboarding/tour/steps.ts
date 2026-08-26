/**
 * What the guided tour points at, per page.
 *
 * Steps address the page through `data-tour` attributes rather than element
 * ids. An id is a document-wide name that anything may collide with and that
 * a later refactor will happily delete as unused; `data-tour` reads as what it
 * is, instrumentation for this file, and survives two instances of the same
 * component on one screen.
 */
import type { Hint } from "@/lib/onboarding/hints";

export type TourStep = {
  /** Matches the `data-tour` attribute on the element to highlight. */
  target: string;
  /** Key under `guide.tour.steps`. `.title` and `.body` hang off it. */
  key: string;
  /** Which side of the target the card prefers. Radix flips it on collision. */
  side?: "top" | "right" | "bottom" | "left";
};

/**
 * A tour's steps, opening step first, and never empty.
 *
 * The opening step is load-bearing beyond being shown first: the guide waits
 * for its target to appear before starting the tour, and treats that as the
 * signal that the route has actually rendered. So it has to point at
 * something the route always puts on the page, never at a conditional
 * section. The tuple type is what stops a later edit leaving a tour with no
 * first step for the guide to wait on.
 */
export type TourSteps = readonly [TourStep, ...TourStep[]];

/**
 * Establish the whole board, narrow to what a single row is, then explain the
 * controls, then hand over to the rest of the portal.
 *
 * The opening step spotlights the board itself rather than dimming the screen
 * behind a floating card: the point of the step is "this table is your path",
 * which only lands if the table is the thing lit up. It prefers the top side
 * because the board runs off the bottom of the viewport, so the only reliable
 * gap beside it is the header strip above.
 *
 * `firstStep` sits on a full-width row, so it also prefers a vertical side:
 * there is no room beside a row that spans the content column, and Radix
 * shifting a colliding card is what made it look clipped.
 */
const JOURNEY_STEPS: TourSteps = [
  { target: "journey-board", key: "overview", side: "top" },
  { target: "journey-first-step", key: "firstStep", side: "bottom" },
  { target: "journey-order", key: "order", side: "bottom" },
  { target: "journey-filters", key: "filters", side: "bottom" },
  { target: "journey-legend", key: "legend", side: "left" },
  { target: "sidebar-nav", key: "sidebar", side: "right" },
  { target: "sidebar-registers", key: "registers", side: "right" },
];

/**
 * The requirement page, in the order someone works it: see where it stands,
 * answer it, prove it, give it an owner, check what the law actually says,
 * then take the decision and move on.
 *
 * `legal` and `decide` drop themselves where they do not apply: a requirement
 * with no mapped citations renders no rows, and the decide group is only
 * rendered while the requirement is still open, so a signed-off or
 * not-applicable one simply has one step fewer.
 */
const REQUIREMENT_STEPS: TourSteps = [
  { target: "requirement-status", key: "status", side: "bottom" },
  { target: "requirement-form", key: "form", side: "top" },
  { target: "requirement-evidence", key: "evidence", side: "top" },
  { target: "requirement-assign", key: "assign", side: "left" },
  { target: "requirement-legal", key: "legal", side: "left" },
  { target: "requirement-decide", key: "decide", side: "top" },
  { target: "requirement-nav", key: "nav", side: "top" },
];

/** A route's walkthrough: which hint owns it, and what it points at. */
export type RouteTour = {
  /** The hint this walkthrough arms and dismisses on its own. */
  hint: Extract<Hint, "journeyTour" | "requirementTour">;
  /** Opening step first; the guide waits on it. See `TourSteps`. */
  steps: TourSteps;
};

/**
 * The tour for a locale-stripped portal path, or null where none is defined.
 *
 * Returning the hint alongside the steps is what keeps the two walkthroughs
 * independent: the guide arms whichever one the current route owns and stamps
 * only that one on dismissal, so skipping the journey overview leaves the
 * requirement page still to come.
 *
 * Steps whose target is absent on the page are dropped before the tour runs
 * (see PortalGuide), so a page may legitimately carry only some of these.
 */
/**
 * Module constants, not literals built per call: the guide keeps the returned
 * tour in an effect dependency, and a fresh object each render re-ran that
 * effect and reset the walkthrough to step one on every keystroke of state.
 */
const JOURNEY_TOUR: RouteTour = { hint: "journeyTour", steps: JOURNEY_STEPS };
const REQUIREMENT_TOUR: RouteTour = {
  hint: "requirementTour",
  steps: REQUIREMENT_STEPS,
};

export function tourForPath(path: string): RouteTour | null {
  const segments = path.split("/").filter(Boolean);
  if (segments[0] === "journey") return JOURNEY_TOUR;
  // /compliance/<category>/<requirement>. The category index is a link list
  // with nothing to explain, so only the three-segment detail page tours.
  if (segments[0] === "compliance" && segments.length === 3) {
    return REQUIREMENT_TOUR;
  }
  return null;
}
