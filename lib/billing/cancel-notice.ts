/**
 * A cancel's confirmation, made but not yet sent. A cancel asked for under Billing sends it at once
 * (sendCancelNotice). A cancel made because the holder deletes their account hands it to the
 * erasure confirmation instead (encloseCancelNotice), so the person gets one letter, not two
 * (lib/gdpr/send-certificate). If the erasure then does not happen, it goes out on its own after
 * all, worded for an account that stays.
 */
import "@/lib/server-guard";
import { documentEmail, sendMail } from "@/lib/mail";
import type { EmailLocale } from "@/lib/mail/locale";
import type { DocumentEmail, DocumentSection, Enclosure } from "@/lib/mail/templates";
import { alertOperators } from "./alert";
import { type CancelWindow, canceledEmailWording } from "./cancel-terms";
import {
  creditNoteAttachment,
  creditNotePdf,
  creditNoteWording,
  deliverCreditNote,
  type IssuedCreditNote,
  sendCreditNoteEmail,
} from "./deliver-credit-note";

/** Where the confirmation goes, and in which language: the holder, as they read the platform. */
export interface HolderContact {
  readonly email: string;
  readonly locale: EmailLocale;
}

export type CancelNotice =
  | {
      readonly kind: "renewal";
      readonly billingAccountId: string;
      readonly holder: HolderContact;
      readonly invoiceNumber: string;
      readonly periodEnd: string;
      readonly reason: Extract<CancelWindow, { kind: "renewal" }>["reason"];
    }
  | {
      readonly kind: "money_back";
      readonly holder: HolderContact;
      /** The client address Qonto has for the invoice, when it is not the holder's. */
      readonly accounting: readonly string[];
      readonly creditNote: IssuedCreditNote;
    };

const renewalWording = (
  notice: Extract<CancelNotice, { kind: "renewal" }>,
  accountErased: boolean,
): DocumentEmail =>
  canceledEmailWording(
    {
      kind: "renewal",
      invoiceNumber: notice.invoiceNumber,
      periodEnd: notice.periodEnd,
      reason: notice.reason,
      accountErased,
    },
    notice.holder.locale,
  );

/**
 * The confirmation as its own email, for an account that stays. A credit note is delivered in the
 * background, since we wait up to half a minute for its PDF; a stopped renewal is sent before this
 * resolves. Never rejects: the cancel has happened, so a failure goes to the operators.
 */
export async function sendCancelNotice(notice: CancelNotice): Promise<void> {
  if (notice.kind === "money_back") {
    const { creditNote, holder } = notice;
    void deliverCreditNote({
      ...creditNote,
      recipients: [holder.email, ...notice.accounting],
      locale: holder.locale,
    }).catch((err: unknown) =>
      alertOperators(`${creditNote.creditNoteNumber} nicht zugestellt`, [
        `Die Zustellung der Gutschrift ${creditNote.creditNoteNumber} ist abgebrochen: ${err instanceof Error ? err.message : String(err)}.`,
        "Aus Qonto von Hand senden.",
      ]),
    );
    return;
  }
  const sent = await documentEmail(renewalWording(notice, false))
    .then((content) =>
      sendMail({
        emailType: "billing.canceled",
        to: notice.holder.email,
        ...content,
        idempotencyKey: `renewal-canceled-${notice.billingAccountId}-${notice.periodEnd}`,
      }),
    )
    .catch(() => ({ success: false }));
  if (!sent.success) {
    await alertOperators("Kündigungsbestätigung nicht zugestellt", [
      `Die Verlängerung für billing account ${notice.billingAccountId} ist gekündigt, die Bestätigung an ${notice.holder.email} ging aber nicht raus.`,
      `Zugang bis ${notice.periodEnd}, Rechnung ${notice.invoiceNumber}. Von Hand bestätigen.`,
    ]);
  }
}

const sectionOf = ({ intro, document, outro }: DocumentEmail): DocumentSection => ({
  intro,
  document,
  outro,
});

/**
 * The confirmation as part of the erasure letter: its section and the credit note PDF to attach,
 * once Qonto has rendered it. The accounting address still gets the credit note on its own, since
 * the erasure record is not theirs to read. Never rejects: a credit note without its PDF still
 * goes in, and the operators are told to send the file by hand.
 */
export async function encloseCancelNotice(
  notice: CancelNotice,
  wait?: (ms: number) => Promise<void>,
): Promise<Enclosure> {
  if (notice.kind === "renewal") {
    return { section: sectionOf(renewalWording(notice, true)), attachment: null };
  }
  const { creditNote, holder, accounting } = notice;
  const pdf = await creditNotePdf(creditNote, wait).catch(async (err: unknown) => {
    await alertOperators(`${creditNote.creditNoteNumber} ohne PDF`, [
      `Das PDF der Gutschrift ${creditNote.creditNoteNumber} war nicht abrufbar: ${err instanceof Error ? err.message : String(err)}. Die Löschbestätigung geht ohne Anhang raus.`,
      "Das PDF aus Qonto von Hand senden und ablegen.",
    ]);
    return null;
  });
  const erasure = {
    failureLabel: `self-erasure, billing account ${creditNote.billingAccountId}`,
  };
  if (accounting.length > 0) {
    await sendCreditNoteEmail(creditNote, pdf, {
      recipients: accounting,
      locale: holder.locale,
      erasure,
    });
  }
  const wording = creditNoteWording(creditNote, {
    attached: pdf !== null,
    accountErased: true,
    locale: holder.locale,
  });
  return {
    section: sectionOf(wording),
    attachment: pdf ? creditNoteAttachment(creditNote, pdf) : null,
  };
}
