/**
 * The thirty days money back of one of the account's invoices (AGB B7): which order it belongs to
 * and whether its money back still stands. The arithmetic is ./money-back-window.
 */
import { asc, eq } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { invoice } from "@/schema";
import { type CancelWindow, cancelWindow } from "./money-back-window";

/**
 * The order an invoice belongs to: the invoice itself, or, for one a platform admin reissued
 * (./reissue), the invoice at the start of that chain. Its id and issue date are what the thirty
 * days are counted from, because reissuing changes the paper and not the order.
 */
export const originalInvoice = async (
  db: DbOrTx,
  inv: { readonly id: string; readonly issueDate: string },
) => {
  let current = inv;
  // Bounded, so a chain that loops by some hand edit cannot hang a page.
  for (let hop = 0; hop < 10; hop++) {
    const [row] = await db
      .select({ replaces: invoice.replacesInvoiceId })
      .from(invoice)
      .where(eq(invoice.id, current.id))
      .limit(1);
    if (!row?.replaces) return current;
    const [prior] = await db
      .select({ id: invoice.id, issueDate: invoice.issueDate })
      .from(invoice)
      .where(eq(invoice.id, row.replaces))
      .limit(1);
    if (!prior) return current;
    current = prior;
  }
  return current;
};

/**
 * Which cancel applies to one of the account's invoices today: the one place the thirty days are
 * decided. An invoice is the first when no invoice of the account was created before it, credited
 * or not, so a renewal and a new order after a cancel never carry money back. A reissued invoice is
 * judged as the one it replaces (originalInvoice), and a waiver recorded on that one ends them.
 */
export const cancelWindowFor = async (
  db: DbOrTx,
  billingAccountId: string,
  inv: { readonly id: string; readonly issueDate: string },
  now: Date,
): Promise<CancelWindow> => {
  const [earliest] = await db
    .select({ id: invoice.id })
    .from(invoice)
    .where(eq(invoice.billingAccountId, billingAccountId))
    .orderBy(asc(invoice.createdAt), asc(invoice.id))
    .limit(1);
  const original = await originalInvoice(db, inv);
  const [waiver] = await db
    .select({ at: invoice.moneyBackWaivedAt })
    .from(invoice)
    .where(eq(invoice.id, original.id))
    .limit(1);
  return cancelWindow(
    {
      issueDate: original.issueDate,
      firstInvoice: earliest?.id === original.id,
      waived: waiver?.at != null,
    },
    now,
  );
};
