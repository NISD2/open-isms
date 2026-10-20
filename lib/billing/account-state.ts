/**
 * Where an account stands with us, and what that lets it do: the one place the paywall, the thirty
 * days money back and the end of a licence meet. Pure, so every state and every way through is a
 * test (account-state.test.ts); the facts come from `billingFactsOf` (./account-facts).
 *
 * The rule (Simon, 20.10.2026; AGB B7 and B10): exporting the company's records and signing off
 * need an order. An account that ordered may do both, but inside the thirty days money back the
 * first one ends the money back, so the person is asked first and their yes is recorded. A
 * grandfathered account keeps both, as it had them before prices. Once a licence ends, exports stay
 * open to an account that paid at some point; sign-offs need a licence again.
 */
import type { AccessLevel } from "./accounts";

/** What the state is derived from, read once per request. */
export interface BillingFacts {
  /** The session's effective level (lib/billing/access.ts); null without a company. */
  readonly level: AccessLevel | null;
  /**
   * The order's thirty days money back, while it stands: inside the thirty days of the account's
   * first invoice and not yet given up. Null otherwise. Only meaningful for a full account.
   */
  readonly moneyBack: { readonly lastDay: string } | null;
  /**
   * Whether the account paid for a licence at some point, or ordered under terms that keep its
   * exports open whatever it paid. Only read for an account without a licence.
   */
  readonly everPaid: boolean;
}

export type BillingState =
  /** Never ordered, or ordered and got its money back: the free part of the walk only. */
  | { readonly kind: "free" }
  /** Was here before prices: keeps the journey free, with its exports and sign-offs. */
  | { readonly kind: "grandfathered" }
  /** Ordered, inside the thirty days money back, which still stands. */
  | { readonly kind: "trial"; readonly lastDay: string }
  /** Ordered, and the money back is over: the thirty days passed or were given up. */
  | { readonly kind: "licensed" }
  /** The licence ended, cancelled, run out or locked, after it was paid: keeps its exports. */
  | { readonly kind: "lapsed" };

export const billingStateOf = (facts: BillingFacts): BillingState => {
  switch (facts.level) {
    case "full":
      return facts.moneyBack
        ? { kind: "trial", lastDay: facts.moneyBack.lastDay }
        : { kind: "licensed" };
    case "grandfathered":
      return { kind: "grandfathered" };
    default:
      return facts.everPaid ? { kind: "lapsed" } : { kind: "free" };
  }
};

/** The acts the terms tie to payment (AGB B7). */
export type BillingAct = "export" | "sign_off";

export type Verdict =
  | { readonly kind: "allow" }
  /** Allowed once the person confirms that it ends the money back on `lastDay`. */
  | { readonly kind: "confirm"; readonly lastDay: string }
  /** Needs an order first. */
  | { readonly kind: "order" };

const ALLOW: Verdict = { kind: "allow" };
const ORDER: Verdict = { kind: "order" };

/** What this state lets the account do; a confirm is answered by recording the waiver first. */
export const verdictFor = (state: BillingState, act: BillingAct): Verdict => {
  switch (state.kind) {
    case "free":
      return ORDER;
    case "grandfathered":
    case "licensed":
      return ALLOW;
    case "trial":
      return { kind: "confirm", lastDay: state.lastDay };
    case "lapsed":
      return act === "export" ? ALLOW : ORDER;
    default:
      return state satisfies never;
  }
};
