/**
 * Delivering a credit note after a cancel inside the thirty days: the PDF, our archive copy, and
 * the confirmation to the customer as `billing.canceled`.
 *
 * Runs after the cancel has committed and is never awaited by it, like ./deliver-invoice. Nothing
 * here can undo the cancel: the credit note exists in Qonto whether or not the email went out, so
 * every failure a person must act on goes to the operators.
 */
import "@/lib/server-guard";
import { documentEmail, sendMail } from "@/lib/mail";
import type { EmailLocale } from "@/lib/mail/locale";
import { putObject } from "@/lib/storage";
import { alertOperators } from "./alert";
import { canceledEmailWording } from "./cancel-terms";
import { pdfFromAttachment } from "./deliver-invoice";
import { getCreditNote, type QontoConfig } from "./qonto";

/** The credit note as issued: everything its PDF, archive copy and email are made from. */
export interface IssuedCreditNote {
  readonly qonto: QontoConfig;
  readonly qontoCreditNoteId: string;
  readonly creditNoteNumber: string;
  /** The credit note's issue date, the day of the cancel. */
  readonly creditNoteDate: string;
  readonly invoiceNumber: string;
  readonly invoiceIssueDate: string;
  /** The credited invoice's amounts, which the credit note cancels in full. */
  readonly amounts: { readonly netCents: number; readonly vatCents: number };
  readonly billingAccountId: string;
  readonly refundOwed: boolean;
}

export interface CreditNoteMail {
  readonly recipients: readonly string[];
  readonly locale: EmailLocale;
  /** The holder's account is erased with this cancel (./cancel-notice encloseCancelNotice). */
  readonly erasure?: { readonly failureLabel: string };
}

export type DeliverCreditNoteInput = IssuedCreditNote &
  CreditNoteMail & {
    /** Replaced in tests, so the polling does not really wait. */
    readonly wait?: (ms: number) => Promise<void>;
  };

const POLL_ATTEMPTS = 8;
const POLL_INTERVAL_MS = 4_000;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Poll until Qonto has rendered the credit note's PDF, or give up. */
const fetchPdf = async (
  note: IssuedCreditNote,
  wait: (ms: number) => Promise<void>,
  attemptsLeft = POLL_ATTEMPTS,
): Promise<Uint8Array | null> => {
  const res = await getCreditNote(note.qonto, note.qontoCreditNoteId);
  const attachmentId = res.ok ? res.data.credit_note?.attachment_id : undefined;
  if (attachmentId) return pdfFromAttachment(note.qonto, attachmentId);
  if (attemptsLeft <= 1) return null;
  await wait(POLL_INTERVAL_MS);
  return fetchPdf(note, wait, attemptsLeft - 1);
};

/**
 * Our copy for the eight years § 14b UStG asks, next to the invoice's. The key follows from the
 * account and the number, so it needs no column to be found again.
 */
const archive = async (note: IssuedCreditNote, pdf: Uint8Array) => {
  const key = `billing/${note.billingAccountId}/${note.creditNoteNumber}.pdf`;
  await putObject(key, pdf, "application/pdf").catch((err: unknown) =>
    alertOperators(`${note.creditNoteNumber} nicht archiviert`, [
      `Die Gutschrift ${note.creditNoteNumber} konnte nicht unter ${key} abgelegt werden: ${err instanceof Error ? err.message : String(err)}.`,
      "Das PDF aus Qonto herunterladen und von Hand ablegen.",
    ]),
  );
};

/**
 * The credit note's PDF once Qonto has rendered it (polled for up to half a minute), archived; null when Qonto
 * delivered none, which the operators are told, since the customer then gets the email without it.
 */
export async function creditNotePdf(
  note: IssuedCreditNote,
  wait: (ms: number) => Promise<void> = sleep,
): Promise<Uint8Array | null> {
  const pdf = await fetchPdf(note, wait);
  if (pdf) await archive(note, pdf);
  else {
    await alertOperators(`${note.creditNoteNumber} ohne PDF`, [
      `Qonto hat für die Gutschrift ${note.creditNoteNumber} (Rechnung ${note.invoiceNumber}, billing account ${note.billingAccountId}) kein PDF geliefert. Die Bestätigung geht ohne Anhang raus.`,
      "Das PDF aus Qonto von Hand an die Rechnungsadresse des Qonto Kunden senden und ablegen.",
    ]);
  }
  return pdf;
}

/** The file the credit note travels as, in its own email or inside another letter. */
export const creditNoteAttachment = (note: IssuedCreditNote, pdf: Uint8Array) => ({
  filename: `${note.creditNoteNumber}.pdf`,
  content: pdf,
  contentType: "application/pdf",
});

/** What the confirmation of this credit note says, in its own email or inside another letter. */
export const creditNoteWording = (
  note: IssuedCreditNote,
  opts: {
    readonly attached: boolean;
    readonly accountErased: boolean;
    readonly locale: EmailLocale;
  },
) =>
  canceledEmailWording(
    {
      kind: "money_back",
      invoiceNumber: note.invoiceNumber,
      invoiceIssueDate: note.invoiceIssueDate,
      creditNoteNumber: note.creditNoteNumber,
      creditNoteDate: note.creditNoteDate,
      amounts: note.amounts,
      refundOwed: note.refundOwed,
      attached: opts.attached,
      accountErased: opts.accountErased,
    },
    opts.locale,
  );

/** The confirmation with the credit note, to `mail.recipients`. A failed send alerts the operators. */
export async function sendCreditNoteEmail(
  note: IssuedCreditNote,
  pdf: Uint8Array | null,
  mail: CreditNoteMail,
): Promise<void> {
  const wording = creditNoteWording(note, {
    attached: pdf !== null,
    accountErased: mail.erasure !== undefined,
    locale: mail.locale,
  });
  const result = await documentEmail(wording)
    .then((content) =>
      sendMail({
        emailType: "billing.canceled",
        to: [...mail.recipients],
        ...content,
        idempotencyKey: `credit-note-${note.creditNoteNumber}`,
        failureLabel: mail.erasure?.failureLabel,
        ...(pdf ? { attachments: [creditNoteAttachment(note, pdf)] } : {}),
      }),
    )
    .catch(() => ({ success: false }));
  if (!result.success) {
    await alertOperators(`${note.creditNoteNumber} nicht zugestellt`, [
      `Die Bestätigung der Gutschrift ${note.creditNoteNumber} ging nicht an ${mail.recipients.join(", ")}.`,
      "Die Gutschrift aus Qonto von Hand senden.",
    ]);
  }
}

export async function deliverCreditNote(input: DeliverCreditNoteInput): Promise<void> {
  const pdf = await creditNotePdf(input, input.wait);
  await sendCreditNoteEmail(input, pdf, input);
}
