import type { InferSelectModel } from "drizzle-orm";
import type { user } from "@/schema";

/**
 * One-time surfaces a new account meets, in the order it meets them.
 *
 * Both gate on `user.loginCount`, not on browser storage. A tour keyed to
 * localStorage fires on the first *visit in this browser*, which is a
 * different fact: a second person on a shared machine is silently treated as
 * a returning user, the same person on a second device is treated as new, and
 * "this is your second login" is not a question browser storage can answer at
 * all. The counter is stamped once per sign-in in the NextAuth `jwt` callback.
 */
export const HINTS = ["tour", "helpOffer"] as const;
export type Hint = (typeof HINTS)[number];

/** The `user` columns the gates below read. */
export type HintState = Pick<
  InferSelectModel<typeof user>,
  "loginCount" | "tourDismissedAt" | "helpOfferDismissedAt"
>;

/**
 * Which one-time surfaces this user still has coming.
 *
 * The tour runs during the first login and the offer of help lands on the
 * second, so the two never stack on one screen. Both are one-shot: dismissing
 * either stamps its column and it does not come back. The tour stays
 * replayable on demand from the help trigger in the portal header, which is
 * what lets every dismissal path be permanent without trapping anyone.
 */
export function resolveHints(state: HintState): Record<Hint, boolean> {
  return {
    tour: state.loginCount <= 1 && state.tourDismissedAt === null,
    helpOffer: state.loginCount >= 2 && state.helpOfferDismissedAt === null,
  };
}
