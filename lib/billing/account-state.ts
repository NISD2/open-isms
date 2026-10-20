/**
 * Where an account stands with us, and what that means for an export or a sign-off: the one place
 * the thirty days money back meets them. Pure, so every state and every way through is a test
 * (account-state.test.ts); the facts come from `billingFactsOf` (./account-facts).
 *
 * The rule (Simon, 20.10.2026; AGB B7): anyone may export and sign off, an account without an order
 * included, so it sees what both do. Inside the thirty days money back of an order, the first
 * export or sign-off ends the money back and makes the invoice payable, so the person is asked
 * first and their yes is recorded. Whether a page or a step is reachable at all is the paywall's
 * business (lib/billing/access.ts), not this file's.
 */
import type { AccessLevel } from "./accounts";

/** What the state is derived from, read once per request. */
export interface BillingFacts {
  /** The session's effective level (lib/billing/access.ts); null without a company. */
  readonly level: AccessLevel | null;
  /**
   * The order's thirty days money back, while it stands: inside the thirty days of the account's
   * first invoice, under terms that tie it to export and sign-off, and not yet given up. Null
   * otherwise. Only meaningful for a full account.
   */
  readonly moneyBack: { readonly lastDay: string } | null;
}

export type BillingState =
  /** No licence: never ordered, got its money back, or the licence ended. */
  | { readonly kind: "free" }
  /** Was here before prices: keeps the journey free. */
  | { readonly kind: "grandfathered" }
  /** Ordered, inside the thirty days money back, which still stands. */
  | { readonly kind: "trial"; readonly lastDay: string }
  /** Ordered, and the money back is over: passed, given up, or never tied to export and sign-off. */
  | { readonly kind: "licensed" };

export const billingStateOf = (facts: BillingFacts): BillingState => {
  switch (facts.level) {
    case "full":
      return facts.moneyBack
        ? { kind: "trial", lastDay: facts.moneyBack.lastDay }
        : { kind: "licensed" };
    case "grandfathered":
      return { kind: "grandfathered" };
    default:
      return { kind: "free" };
  }
};

/** The acts the terms tie to the money back (AGB B7). */
export type BillingAct = "export" | "sign_off";

export type Verdict =
  | { readonly kind: "allow" }
  /** Allowed once the person confirms that it ends the money back on `lastDay`. */
  | { readonly kind: "confirm"; readonly lastDay: string };

/**
 * What this state means for an act; a confirm is answered by recording the waiver first. Both acts
 * are treated alike today; the act is still named so the dialog and the waiver can say which one.
 */
export const verdictFor = (state: BillingState, _act: BillingAct): Verdict =>
  state.kind === "trial"
    ? { kind: "confirm", lastDay: state.lastDay }
    : { kind: "allow" };
