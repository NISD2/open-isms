/**
 * What may stop an order, and what may not.
 *
 * This file exists because "the invoice still goes out when VIES is down" was true only as a
 * consequence of how the branches happened to be written. That is not good enough for a rule that
 * decides whether money can be taken, so it is stated here once and tested directly.
 *
 * THE RULE: **nothing a third party says or fails to say can stop an order.**
 *
 *   - VIES being down must never block. It is 27 legacy government backends behind one facade with
 *     no service guarantee, and it was observed failing for forty minutes straight on 24.09.2026
 *     while its own status endpoint claimed the service was fine.
 *   - VIES saying "not registered" must not block either. A newly issued number can take weeks to
 *     appear in the register, member states lag, and refusing a sale on a third party's opinion is
 *     the same failure with better manners.
 *   - The one thing that stops the form is the offline check digit, because that is deterministic,
 *     needs no network, and catches the failure that actually happens, which is a typo. Even then
 *     it asks rather than refuses.
 *
 * The check is not discarded when it fails: every attempt is recorded, the outage included, and
 * retried later. The trail is the point, not the verdict.
 */
import type { VatCheck } from "./vies";
import { checkStructure, structuralMessage, type StructuralCheck } from "./vat-checksum";

export type OrderGate =
  /** Proceed, with nothing to say. */
  | { readonly proceed: true; readonly warning: null }
  /** Proceed, but tell them what we noticed. Never a wall. */
  | { readonly proceed: true; readonly warning: string }
  /**
   * Ask them to look at the field again. Only ever from the offline check, and only ever because
   * the number cannot be right, never because a register was unreachable or disagreed.
   */
  | { readonly proceed: false; readonly warning: string };

/**
 * Decide whether an order may go ahead.
 *
 * `structural` is the offline result and is the only input that can return `proceed: false`.
 * `registry` is whatever VIES said, or did not say, and can only ever add a warning.
 */
export const orderGate = (
  structural: StructuralCheck,
  registry: VatCheck | null,
): OrderGate => {
  if (!structural.ok) {
    const message = structuralMessage(structural);
    return { proceed: false, warning: message ?? "Please check the VAT number." };
  }

  // From here the number is structurally sound and the order proceeds whatever happens next.
  switch (registry?.status) {
    case "invalid":
      return {
        proceed: true,
        warning:
          "The EU register does not know this number yet. That is normal for a recently issued one. We will check again, and the invoice is not held up.",
      };
    case "unavailable":
      // Deliberately silent. A government backend being down at ten at night is not the
      // customer's problem and telling them about it only creates doubt at the worst moment.
      return { proceed: true, warning: null };
    case "valid":
    case "malformed":
    case undefined:
      return { proceed: true, warning: null };
  }
};

/** Convenience for the common path: take what the user typed, take what VIES said, decide. */
export const gateFromInput = (
  countryCode: string,
  vatNumber: string,
  registry: VatCheck | null,
): OrderGate => orderGate(checkStructure(countryCode, vatNumber), registry);
