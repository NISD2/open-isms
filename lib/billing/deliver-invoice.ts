/**
 * Delivering an issued invoice: the PDF, our archive copy, and the email to the customer.
 *
 * Runs after the order has committed and is never awaited by it, because Qonto renders the PDF a
 * few seconds after the invoice exists. Nothing here can undo the order: every failure is logged
 * and the order stands, since the invoice is issued in Qonto whether or not the email went out.
 *
 * Qonto's own "send by email" is not used. It sends from Qonto's address in Qonto's wording; this
 * sends from ours, in the wording of lib/billing/order.ts, with the PDF attached.
 */
import { eq } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { invoiceEmail, sendMail } from "@/lib/mail";
import { putObject } from "@/lib/storage";
import { invoice } from "@/schema";
import { invoiceEmailWording } from "./order";
import { downloadPdf, getAttachment, getInvoice, type QontoConfig } from "./qonto";
import { httpsHostOf } from "./sandbox-gate";

export interface DeliverInvoiceInput {
  readonly db: Database;
  readonly qonto: QontoConfig;
  readonly invoiceRowId: string;
  readonly qontoInvoiceId: string;
  readonly number: string;
  readonly billingAccountId: string;
  readonly recipients: readonly string[];
  readonly locale: "de" | "en";
  /** Replaced in tests, so the polling does not really wait. */
  readonly wait?: (ms: number) => Promise<void>;
}

/** What Qonto has for an invoice: the PDF once rendered, and the public page meanwhile. */
interface InvoiceDocument {
  readonly pdf: Uint8Array | null;
  readonly invoiceUrl: string | null;
}

const POLL_ATTEMPTS = 8;
const POLL_INTERVAL_MS = 4_000;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Qonto's public invoice page, only when it really is an https link: it goes into an email. */
const safeInvoiceUrl = (url: string | undefined): string | null =>
  url && httpsHostOf(url) ? url : null;

const pdfFromAttachment = async (qonto: QontoConfig, attachmentId: string) => {
  const attachment = await getAttachment(qonto, attachmentId);
  const url = attachment.ok ? attachment.data.attachment?.url : undefined;
  if (!url) {
    console.error(
      `[billing] attachment ${attachmentId} gave no download link`,
      attachment,
    );
    return null;
  }
  const pdf = await downloadPdf(url);
  if (!pdf.ok) console.error(`[billing] invoice PDF download failed: ${pdf.error}`);
  return pdf.ok ? pdf.data : null;
};

/** Poll until Qonto has rendered the PDF, or give up and keep only the public page. */
const fetchInvoiceDocument = async (
  qonto: QontoConfig,
  qontoInvoiceId: string,
  wait: (ms: number) => Promise<void>,
  attemptsLeft = POLL_ATTEMPTS,
  lastKnownUrl: string | null = null,
): Promise<InvoiceDocument> => {
  const res = await getInvoice(qonto, qontoInvoiceId);
  const record = res.ok ? res.data.client_invoice : undefined;
  const invoiceUrl = safeInvoiceUrl(record?.invoice_url) ?? lastKnownUrl;
  if (record?.attachment_id) {
    return { pdf: await pdfFromAttachment(qonto, record.attachment_id), invoiceUrl };
  }
  if (attemptsLeft <= 1) return { pdf: null, invoiceUrl };
  await wait(POLL_INTERVAL_MS);
  return fetchInvoiceDocument(qonto, qontoInvoiceId, wait, attemptsLeft - 1, invoiceUrl);
};

/** Keep our own copy for the eight years § 14b UStG asks, and remember where it is. */
const archivePdf = async (input: DeliverInvoiceInput, pdf: Uint8Array) => {
  const key = `billing/${input.billingAccountId}/${input.number}.pdf`;
  try {
    await putObject(key, pdf, "application/pdf");
    await input.db
      .update(invoice)
      .set({ archivedPdfKey: key })
      .where(eq(invoice.id, input.invoiceRowId));
  } catch (err) {
    console.error(`[billing] archiving invoice ${input.number} failed`, err);
  }
};

const sendInvoice = async (input: DeliverInvoiceInput, document: InvoiceDocument) => {
  // With the PDF attached the link is left out, so the email names one place the invoice is.
  const invoiceUrl = document.pdf ? null : document.invoiceUrl;
  const wording = invoiceEmailWording({
    number: input.number,
    locale: input.locale,
    invoiceUrl,
  });
  const content = invoiceEmail({ ...wording, invoiceUrl });
  const result = await sendMail({
    emailType: "billing.invoice",
    to: [...input.recipients],
    ...content,
    idempotencyKey: `invoice-${input.number}`,
    ...(document.pdf
      ? {
          attachments: [
            {
              filename: `${input.number}.pdf`,
              content: document.pdf,
              contentType: "application/pdf",
            },
          ],
        }
      : {}),
  });
  if (!result.success) console.error(`[billing] invoice ${input.number} email not sent`);
};

export async function deliverInvoice(input: DeliverInvoiceInput): Promise<void> {
  const document = await fetchInvoiceDocument(
    input.qonto,
    input.qontoInvoiceId,
    input.wait ?? sleep,
  );
  if (document.pdf) await archivePdf(input, document.pdf);
  if (!document.pdf && !document.invoiceUrl) {
    console.error(
      `[billing] invoice ${input.number} has neither a PDF nor a link yet; no email sent, send it from Qonto by hand`,
    );
    return;
  }
  await sendInvoice(input, document);
}
