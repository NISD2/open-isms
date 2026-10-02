/**
 * The customer's confirmation that a refund owed under a credit note went out, sent when a platform
 * admin records the transfer in the Subscriptions tab. It closes the promise the credit note email
 * made ("we confirm it in a short email"), so it goes to the same readers: the billing account's
 * holder, in their language, and the accounting address the credit note was issued to in Qonto.
 *
 * A holder who deleted their account is gone, and nothing is sent: the transfer itself reaches
 * them. Never throws, because the refund is already recorded by the time this runs.
 */
import "@/lib/server-guard";
import { eq } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { documentEmail, sendMail } from "@/lib/mail";
import { wasDelivered } from "@/lib/mail/delivery";
import { resolveEmailLocale } from "@/lib/mail/locale";
import { billingAccount, creditNote, invoice, user } from "@/schema";
import { accountingCopy } from "./cancel";
import { refundSentWording } from "./cancel-terms";
import type { OrderingMode } from "./ordering";
import { getCreditNote } from "./qonto";

/** What became of the confirmation, for the admin who recorded the transfer. */
export type RefundConfirmation = "sent" | "no_holder" | "not_sent";

/** The credit note's Qonto client address, when it is a second reader. Qonto unreachable: none. */
const accountingAddress = async (
  mode: OrderingMode,
  qontoCreditNoteId: string,
  holder: string,
): Promise<readonly string[]> => {
  if (mode.kind === "off") return [];
  const res = await getCreditNote(mode.qonto, qontoCreditNoteId);
  return res.ok ? accountingCopy(res.data.credit_note?.client?.email, holder) : [];
};

const confirm = async (
  db: DbOrTx,
  mode: OrderingMode,
  creditNoteId: string,
): Promise<RefundConfirmation> => {
  const [row] = await db
    .select({
      creditNoteNumber: creditNote.number,
      qontoCreditNoteId: creditNote.qontoCreditNoteId,
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
  const accounting = await accountingAddress(
    mode,
    row.qontoCreditNoteId,
    row.email,
  ).catch(() => []);
  const result = await sendMail({
    emailType: "billing.refund_sent",
    to: [row.email, ...accounting],
    ...(await documentEmail(wording)),
    idempotencyKey: `refund-sent-${row.creditNoteNumber}`,
  });
  return wasDelivered(result) ? "sent" : "not_sent";
};

export const sendRefundConfirmation = (
  db: DbOrTx,
  mode: OrderingMode,
  creditNoteId: string,
): Promise<RefundConfirmation> =>
  confirm(db, mode, creditNoteId).catch((err: unknown) => {
    console.error(
      `[billing] refund confirmation for credit note ${creditNoteId} failed`,
      err,
    );
    return "not_sent" as const;
  });
