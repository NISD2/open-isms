/** What an account has been invoiced: read by the order, the cancel and the billing page alike. */
import { and, desc, eq, gte, isNull } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { creditNote, invoice } from "@/schema";
import { invoiceToday } from "./order";

/** Whether the account was ever invoiced, credited or not: the next invoice is then not its first. */
export const hasInvoice = async (
  db: DbOrTx,
  billingAccountId: string,
): Promise<boolean> => {
  const [any] = await db
    .select({ id: invoice.id })
    .from(invoice)
    .where(eq(invoice.billingAccountId, billingAccountId))
    .limit(1);
  return any !== undefined;
};

/**
 * The invoice that pays for the account right now: its year has not ended and it was not credited.
 * One definition for the order's refusal and the billing page, so they cannot disagree.
 */
export const findActiveInvoice = async (
  db: DbOrTx,
  billingAccountId: string,
  now: Date,
) => {
  const [active] = await db
    .select({
      id: invoice.id,
      number: invoice.number,
      issueDate: invoice.issueDate,
      periodEnd: invoice.periodEnd,
    })
    .from(invoice)
    .leftJoin(creditNote, eq(creditNote.invoiceId, invoice.id))
    .where(
      and(
        eq(invoice.billingAccountId, billingAccountId),
        gte(invoice.periodEnd, invoiceToday(now)),
        isNull(creditNote.id),
      ),
    )
    .orderBy(desc(invoice.periodEnd))
    .limit(1);
  return active ?? null;
};
