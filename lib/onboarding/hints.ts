import type { InferSelectModel } from "drizzle-orm";
import type { user } from "@/schema";

/**
 * One-time surfaces a new account meets, in the order it meets them.
 *
 * Every one of them is recorded in a column on the user row, never in browser
 * storage. Storage answers "first visit in this browser", which is a different
 * fact: a second person on a shared machine is silently treated as a returning
 * user, the same person on a second device is treated as new, and "this is
 * your second login" is not a question storage can answer at all. Where a
 * surface additionally wants a login number, it reads `user.loginCount`, which
 * the NextAuth `jwt` callback stamps once per sign-in.
 *
 * Each is a separate entry because each is a separate walkthrough. Skipping
 * the journey says nothing about whether someone wants the requirement page
 * explained, and the journey itself has one per layout: being walked through
 * the guided path says nothing about the role swimlane, which that user may
 * not meet until they switch months later.
 */
export const HINTS = [
  "journeyTourGuided",
  "journeyTourTeam",
  "requirementTour",
  "helpOffer",
] as const;
export type Hint = (typeof HINTS)[number];

/** The `user` columns the gates below read. */
export type HintState = Pick<
  InferSelectModel<typeof user>,
  | "loginCount"
  | "journeyTourGuidedDismissedAt"
  | "journeyTourTeamDismissedAt"
  | "requirementTourDismissedAt"
  | "helpOfferDismissedAt"
>;

/**
 * Which column each surface stamps when it is dismissed.
 *
 * Callers that write a dismissal derive the column from here rather than
 * carrying their own switch, so adding a surface is one entry rather than a
 * hunt through the mutations that happen to know about it.
 */
export const HINT_COLUMN = {
  journeyTourGuided: "journeyTourGuidedDismissedAt",
  journeyTourTeam: "journeyTourTeamDismissedAt",
  requirementTour: "requirementTourDismissedAt",
  helpOffer: "helpOfferDismissedAt",
} as const satisfies Record<Hint, keyof HintState>;

/**
 * Which one-time surfaces this user still has coming.
 *
 * Each is one-shot: dismissing one stamps its own column and it does not come
 * back. All of them stay replayable on demand from the help trigger in the
 * portal header, which is what lets every dismissal path be permanent without
 * trapping anyone.
 *
 * The two journey walkthroughs deliberately do NOT gate on the first login,
 * unlike the requirement one. The journey has two layouts and a user meets the
 * second one whenever they switch, which is usually long after login one; a
 * first-login gate would mean the layout they switched into is the one nobody
 * ever explains. Being unseen is the gate, and the column records it.
 *
 * That leaves the stacking problem the first-login gate used to solve on its
 * own — a pending walkthrough colliding with the second-login offer of help.
 * PortalGuide holds a tour back while the help dialog is open, which is the
 * component that owns both surfaces and can actually see the collision.
 */
export function resolveHints(state: HintState): Record<Hint, boolean> {
  const firstLogin = state.loginCount <= 1;
  return {
    journeyTourGuided: state.journeyTourGuidedDismissedAt === null,
    journeyTourTeam: state.journeyTourTeamDismissedAt === null,
    requirementTour: firstLogin && state.requirementTourDismissedAt === null,
    helpOffer: state.loginCount >= 2 && state.helpOfferDismissedAt === null,
  };
}
