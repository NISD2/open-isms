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
 * The journey renders in two layouts, so it has two walkthroughs.
 *
 * The guided line is for a company where one person implements everything; the
 * role swimlane for one where several do. They share almost no controls, which
 * is why this is two step lists with two hints rather than one list filtered
 * down: someone who was walked through the guided path and later switches has
 * still never been shown the swimlane, and a single hint would record the
 * opposite.
 *
 * Which one runs is decided by which opening anchor is on the page. Both
 * layouts withhold that anchor until the mode question is answered, which is
 * what keeps a walkthrough from starting underneath the dialog.
 */
/**
 * Establish the line, then the pinned bar that keeps you oriented on it, then
 * what is due when, then the one live step, then the rest of the portal. The
 * path runs off the bottom of the viewport, so the opening step prefers the
 * strip above it; the nodes are a narrow centred column, so the step that
 * points at one has room beside it.
 */
const JOURNEY_GUIDED_STEPS: TourSteps = [
  { target: "journey-path-guided", key: "overview", side: "top" },
  { target: "journey-stage", key: "stage", side: "bottom" },
  { target: "journey-timeline", key: "timeline", side: "bottom" },
  { target: "journey-live-step", key: "liveStep", side: "right" },
  { target: "sidebar-nav", key: "sidebar", side: "right" },
  { target: "sidebar-registers", key: "registers", side: "right" },
];

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
const JOURNEY_TEAM_STEPS: TourSteps = [
  { target: "journey-path-team", key: "overview", side: "top" },
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
  hint: Extract<Hint, "journeyTourGuided" | "journeyTourTeam" | "requirementTour">;
  /** Opening step first; the guide waits on it. See `TourSteps`. */
  steps: TourSteps;
};

/**
 * Module constants, not literals built per call: the guide keeps the returned
 * tour in an effect dependency, and a fresh object each render re-ran that
 * effect and reset the walkthrough to step one on every keystroke of state.
 */
const JOURNEY_GUIDED_TOUR: RouteTour = {
  hint: "journeyTourGuided",
  steps: JOURNEY_GUIDED_STEPS,
};
const JOURNEY_TEAM_TOUR: RouteTour = {
  hint: "journeyTourTeam",
  steps: JOURNEY_TEAM_STEPS,
};
const REQUIREMENT_TOUR: RouteTour = {
  hint: "requirementTour",
  steps: REQUIREMENT_STEPS,
};

const NO_TOURS: readonly RouteTour[] = [];
const JOURNEY_TOURS: readonly RouteTour[] = [JOURNEY_GUIDED_TOUR, JOURNEY_TEAM_TOUR];
const REQUIREMENT_TOURS: readonly RouteTour[] = [REQUIREMENT_TOUR];

/**
 * The walkthroughs a locale-stripped portal path may run, in preference order.
 *
 * A list rather than one tour because the journey has two layouts and the path
 * alone cannot say which is rendered. The guide takes the first candidate that
 * is both still armed and whose opening anchor is on the page, so the layout
 * present decides, and each candidate carries its own hint — which is what
 * keeps the walkthroughs independent. Dismissing the guided one leaves the
 * swimlane still to come if the user ever switches, and skipping the journey
 * leaves the requirement page untouched.
 */
export function toursForPath(path: string): readonly RouteTour[] {
  const segments = path.split("/").filter(Boolean);
  if (segments[0] === "journey") return JOURNEY_TOURS;
  // /compliance/<category>/<requirement>. The category index is a link list
  // with nothing to explain, so only the three-segment detail page tours.
  if (segments[0] === "compliance" && segments.length === 3) {
    return REQUIREMENT_TOURS;
  }
  return NO_TOURS;
}
