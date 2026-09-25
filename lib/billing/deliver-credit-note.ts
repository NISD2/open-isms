/**
 * Delivering a credit note after a cancel inside the thirty days: the PDF, our archive copy, and
 * the confirmation to the customer as `billing.canceled`.
 *
 * Runs after the cancel has committed and is never awaited by it, like ./deliver-invoice. Nothing
 * here can undo the cancel: the credit note exists in Qonto whether or not the email went out, so
 * every failure a person must act on goes to the operators.
 */
import "@/lib/server-guard";
import { invoiceEmail, sendMail } from "@/lib/mail";
import { putObject } from "@/lib/storage";
import { alertOperators } from "./alert";
import { canceledEmailWording, type EmailLocale } from "./cancel-terms";
import { pdfFromAttachment } from "./deliver-invoice";
import { getCreditNote, type QontoConfig } from "./qonto";

export interface DeliverCreditNoteInput {
  readonly qonto: QontoConfig;
  readonly qontoCreditNoteId: string;
  readonly creditNoteNumber: string;
  readonly invoiceNumber: string;
  readonly billingAccountId: string;
  readonly refundOwed: boolean;
  readonly recipients: readonly string[];
  readonly locale: EmailLocale;
  /** Replaced in tests, so the polling does not really wait. */
  readonly wait?: (ms: number) => Promise<void>;
}

const POLL_ATTEMPTS = 8;
const POLL_INTERVAL_MS = 4_000;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Poll until Qonto has rendered the credit note's PDF, or give up. */
const fetchPdf = async (
  input: DeliverCreditNoteInput,
  wait: (ms: number) => Promise<void>,
  attemptsLeft = POLL_ATTEMPTS,
): Promise<Uint8Array | null> => {
  const res = await getCreditNote(input.qonto, input.qontoCreditNoteId);
  const attachmentId = res.ok ? res.data.credit_note?.attachment_id : undefined;
  if (attachmentId) return pdfFromAttachment(input.qonto, attachmentId);
  if (attemptsLeft <= 1) return null;
  await wait(POLL_INTERVAL_MS);
  return fetchPdf(input, wait, attemptsLeft - 1);
};

/**
 * Our copy for the eight years § 14b UStG asks, next to the invoice's. The key follows from the
 * account and the number, so it needs no column to be found again.
 */
const archive = async (input: DeliverCreditNoteInput, pdf: Uint8Array) => {
  const key = `billing/${input.billingAccountId}/${input.creditNoteNumber}.pdf`;
  await putObject(key, pdf, "application/pdf").catch((err: unknown) =>
    alertOperators(`${input.creditNoteNumber} nicht archiviert`, [
      `Die Gutschrift ${input.creditNoteNumber} konnte nicht unter ${key} abgelegt werden: ${err instanceof Error ? err.message : String(err)}.`,
      "Das PDF aus Qonto herunterladen und von Hand ablegen.",
    ]),
  );
};

export async function deliverCreditNote(input: DeliverCreditNoteInput): Promise<void> {
  const pdf = await fetchPdf(input, input.wait ?? sleep);
  if (pdf) await archive(input, pdf);
  else {
    await alertOperators(`${input.creditNoteNumber} ohne PDF`, [
      `Qonto hat für die Gutschrift ${input.creditNoteNumber} kein PDF geliefert. Die Bestätigung an ${input.recipients.join(", ")} geht ohne Anhang raus.`,
      "Das PDF aus Qonto von Hand senden und ablegen.",
    ]);
  }

  const wording = canceledEmailWording(
    {
      kind: "money_back",
      invoiceNumber: input.invoiceNumber,
      creditNoteNumber: input.creditNoteNumber,
      refundOwed: input.refundOwed,
      attached: pdf !== null,
    },
    input.locale,
  );
  const result = await sendMail({
    emailType: "billing.canceled",
    to: [...input.recipients],
    ...invoiceEmail({ ...wording, invoiceUrl: null }),
    idempotencyKey: `credit-note-${input.creditNoteNumber}`,
    ...(pdf
      ? {
          attachments: [
            {
              filename: `${input.creditNoteNumber}.pdf`,
              content: pdf,
              contentType: "application/pdf",
            },
          ],
        }
      : {}),
  });
  if (!result.success) {
    await alertOperators(`${input.creditNoteNumber} nicht zugestellt`, [
      `Die Bestätigung der Gutschrift ${input.creditNoteNumber} ging nicht an ${input.recipients.join(", ")}.`,
      "Die Gutschrift aus Qonto von Hand senden.",
    ]);
  }
}
