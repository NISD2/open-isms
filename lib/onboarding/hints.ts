import type { InferSelectModel } from "drizzle-orm";
import type { user } from "@/schema";

/**
 * One-time surfaces a new account meets, in the order it meets them.
 *
 * All three gate on `user.loginCount`, not on browser storage. A tour keyed to
 * localStorage fires on the first *visit in this browser*, which is a
 * different fact: a second person on a shared machine is silently treated as
 * a returning user, the same person on a second device is treated as new, and
 * "this is your second login" is not a question browser storage can answer at
 * all. The counter is stamped once per sign-in in the NextAuth `jwt` callback.
 *
 * The two tours are separate entries because they are separate walkthroughs
 * on separate pages. Skipping the journey overview says nothing about whether
 * someone wants the requirement page explained, and collapsing both into one
 * flag meant skipping the first silently cancelled the second.
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
