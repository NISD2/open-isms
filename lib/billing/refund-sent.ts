/**
 * The customer's confirmation that a refund owed under a credit note went out, sent when a platform
 * admin records the transfer in the Subscriptions tab. It closes the promise the credit note email
 * made ("we confirm it in a short email").
 *
 * It goes to the billing account's holder, in their language. A holder who deleted their account
 * is gone, and so is their address: nothing is sent, and the transfer itself reaches them.
 */
import "@/lib/server-guard";
import { eq } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { documentEmail, sendMail } from "@/lib/mail";
import { wasDelivered } from "@/lib/mail/delivery";
import { resolveEmailLocale } from "@/lib/mail/locale";
import { billingAccount, creditNote, invoice, user } from "@/schema";
import { refundSentWording } from "./cancel-terms";

/** What became of the confirmation, for the admin who recorded the transfer. */
export type RefundConfirmation = "sent" | "no_holder" | "not_sent";

export async function sendRefundConfirmation(
  db: DbOrTx,
  creditNoteId: string,
): Promise<RefundConfirmation> {
  const [row] = await db
    .select({
      creditNoteNumber: creditNote.number,
      invoiceNumber: invoice.number,
      netCents: invoice.netCents,
      vatCents: invoice.vatCents,
      email: user.email,
      locale: user.locale,
    })
    .from(creditNote)
    .innerJoin(invoice, eq(invoice.id, creditNote.invoiceId))
    .innerJoin(billingAccount, eq(billingAccount.id, invoice.billingAccountId))
    .leftJoin(user, eq(user.id, billingAccount.ownerUserId))
    .where(eq(creditNote.id, creditNoteId))
    .limit(1);
  if (!row?.email) return "no_holder";

  const wording = refundSentWording(
    {
      creditNoteNumber: row.creditNoteNumber,
      invoiceNumber: row.invoiceNumber,
      amounts: { netCents: row.netCents, vatCents: row.vatCents },
    },
    resolveEmailLocale(row.locale, null),
  );
  const result = await sendMail({
    emailType: "billing.refund_sent",
    to: row.email,
    ...documentEmail(wording),
    idempotencyKey: `refund-sent-${row.creditNoteNumber}`,
  }).catch(() => ({ success: false }) as const);
  return wasDelivered(result) ? "sent" : "not_sent";
}
