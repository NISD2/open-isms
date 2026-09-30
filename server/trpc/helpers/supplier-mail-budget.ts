/**
 * How much mail one company can make us send through the supplier paths:
 * adding a customer as a recipient of its security updates and publishing an
 * incident notice to one (supplier portal), and inviting a supplier or sending
 * that invite again (entity side).
 *
 * Every one of those mails goes from our domain to an address the sender typed
 * in, and supplier onboarding is self service, so without a ceiling any
 * company that signs up could have us mail anyone, as often as it likes. The
 * mails carry no text the sender wrote (lib/mail/templates.ts); these budgets
 * bound how many there are.
 *
 * Sized well above honest use. A customer inviting its 50 suppliers in one
 * afternoon, or a supplier adding its 80 customers, stays inside every budget,
 * and so does a supplier sending one incident notice to each of 150 customers
 * in an hour. Counted per company in Postgres (lib/rate-limit.ts), so the
 * budgets hold across replicas and redeploys.
 */
import { TRPCError } from "@trpc/server";
import { rateLimit } from "@/lib/rate-limit";

const HOUR_MS = 60 * 60_000;
const DAY_MS = 24 * HOUR_MS;

type Budget = {
  readonly limit: number;
  readonly windowMs: number;
  /** Shown as is: the three forms print the server's message for TOO_MANY_REQUESTS. */
  readonly refusal: string;
};

export const SUPPLIER_MAIL_BUDGET = {
  /** relationship.invite calls by one supplier, whether or not the address is new. */
  customerInvites: {
    limit: 100,
    windowMs: HOUR_MS,
    refusal:
      "Your organization has added many customers in the last hour. Please try again later.",
  },
  /** Incident notices one supplier publishes, across all its customers. */
  incidentNotices: {
    limit: 200,
    windowMs: HOUR_MS,
    refusal:
      "Your organization has published many incident notices in the last hour. Please try again later.",
  },
  /** Incident notices one supplier publishes to one customer. */
  incidentNoticesPerCustomer: {
    limit: 10,
    windowMs: DAY_MS,
    refusal:
      "This customer has already received many incident notices from you today. Please try again later.",
  },
  /** supplierInvite.create calls by one customer: new invites and invites sent again. */
  supplierInvites: {
    limit: 100,
    windowMs: HOUR_MS,
    refusal:
      "Your organization has sent many supplier invitations in the last hour. Please try again later.",
  },
  /**
   * Addresses a company had never mailed on these paths, across all of them.
   * An address it already mails (an existing customer, an invite sent again) is
   * bounded by the budgets above, not here.
   */
  newRecipients: {
    limit: 200,
    windowMs: DAY_MS,
    refusal:
      "Your organization has reached today's limit for new email recipients. Please try again later.",
  },
} as const satisfies Record<string, Budget>;

export type SupplierMailBudget = keyof typeof SUPPLIER_MAIL_BUDGET;

/**
 * Counts one use of `budget` for `scope` (a company id, or a company and a
 * relationship) and refuses with TOO_MANY_REQUESTS once it is spent.
 */
export async function requireSupplierMailBudget(
  budget: SupplierMailBudget,
  scope: string,
): Promise<void> {
  const { limit, windowMs, refusal } = SUPPLIER_MAIL_BUDGET[budget];
  if (!(await rateLimit(`supplier-mail:${budget}:${scope}`, limit, windowMs))) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: refusal });
  }
}
