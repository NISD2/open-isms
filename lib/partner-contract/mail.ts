/**
 * What goes out once a partner accepts: their copy of the agreement, with the full text below the
 * card, and a notice to the operators. Never throws, because the acceptance is already recorded by
 * the time this runs; the answer says whether the partner's copy left.
 */
import "@/lib/server-guard";
import { getPlatformAdminEmails } from "@/lib/auth/platform-admin";
import { SELLER } from "@/lib/billing/seller";
import { documentEmail, newSaleEmail, sendMail } from "@/lib/mail";
import { deliverToOperators, wasDelivered } from "@/lib/mail/delivery";
import { renderRecordMarkdown } from "@/lib/mail/markdown";
import { getAppUrl } from "@/lib/utils";
import type { partnerContract } from "@/schema";
import type { PartnerAccessOutcome } from "./access";
import { formatPartnerContractDate, type PartnerContractLocale } from "./date";
import { partnerContractText } from "./document";

type Row = typeof partnerContract.$inferSelect;

export interface AcceptedPartnerContract extends Row {
  readonly signedAt: Date;
  readonly signerName: string;
  readonly signerEmail: string;
}

/** A short reference both sides can quote: the first block of the row's id. */
export const partnerContractReference = (id: string): string =>
  `PV-${id.slice(0, 8).toUpperCase()}`;

const commissionLine = (row: Row, locale: PartnerContractLocale): string => {
  const months = row.commissionMonths;
  if (locale === "de") {
    return months === null
      ? `${row.commissionPercent} %, solange der Kunde zahlt`
      : `${row.commissionPercent} %, für die ersten ${months} Monate je Kunde`;
  }
  return months === null
    ? `${row.commissionPercent}%, for as long as the customer pays`
    : `${row.commissionPercent}%, for the first ${months} months per customer`;
};

/** What the offer did for the contact email's access, as the operators read it. */
export const OPERATOR_ACCESS: Record<PartnerAccessOutcome | "none", string> = {
  new_account: "neues Konto für die Kontaktadresse, voller Zugang",
  existing_account: "bestehendes Konto der Kontaktadresse auf vollen Zugang gesetzt",
  not_holder:
    "nicht vergeben: die Kontaktadresse gehört zu einem Konto, das jemand anderes hält",
  failed: "nicht vergeben: Fehler beim Einrichten",
  none: "keiner, ohne Kontaktadresse angeboten",
};

const WORDING = {
  de: (row: AcceptedPartnerContract) => ({
    subject: `Partnervereinbarung mit nisd2 angenommen, ${partnerContractReference(row.id)}`,
    heading: "Partnervereinbarung angenommen",
    greeting: `Guten Tag ${row.signerName},`,
    intro: [
      `vielen Dank. Sie haben die Partnervereinbarung zwischen ${row.partnerCompany} und nisd2 angenommen. Den vollständigen Text finden Sie unter dieser E-Mail.`,
    ],
    kind: "Partnervereinbarung",
    facts: [
      { label: "Partner", value: row.partnerCompany },
      { label: "Provision", value: commissionLine(row, "de"), emphasis: true },
      { label: "Angenommen von", value: `${row.signerName}, ${row.signerEmail}` },
      {
        label: "Angenommen am",
        value: formatPartnerContractDate(row.signedAt, "de", true),
      },
    ],
    outro: [
      `Wenn Sie uns ein Unternehmen empfehlen, schreiben Sie kurz an ${SELLER.email}, mit Firma und Ansprechpartner.`,
    ],
  }),
  en: (row: AcceptedPartnerContract) => ({
    subject: `Partner agreement with nisd2 accepted, ${partnerContractReference(row.id)}`,
    heading: "Partner agreement accepted",
    greeting: `Hello ${row.signerName},`,
    intro: [
      `Thank you. You have accepted the partner agreement between ${row.partnerCompany} and nisd2. The full text is below this email.`,
    ],
    kind: "Partner agreement",
    facts: [
      { label: "Partner", value: row.partnerCompany },
      { label: "Commission", value: commissionLine(row, "en"), emphasis: true },
      { label: "Accepted by", value: `${row.signerName}, ${row.signerEmail}` },
      {
        label: "Accepted on",
        value: formatPartnerContractDate(row.signedAt, "en", true),
      },
    ],
    outro: [
      `When you recommend a company to us, write a short note to ${SELLER.email} with the company and a contact person.`,
    ],
  }),
} as const satisfies Record<PartnerContractLocale, unknown>;

/** The partner's copy: the card with what was agreed, then the full text they accepted. */
export const partnerCopyEmail = async (row: AcceptedPartnerContract) => {
  const w = WORDING[row.locale](row);
  const text = partnerContractText(row.body);
  return documentEmail({
    locale: row.locale,
    subject: w.subject,
    heading: w.heading,
    greeting: w.greeting,
    intro: w.intro,
    document: {
      kind: w.kind,
      reference: partnerContractReference(row.id),
      facts: w.facts,
    },
    outro: w.outro,
    appendix: { html: await renderRecordMarkdown(text), text },
  });
};

const sendPartnerCopy = async (row: AcceptedPartnerContract): Promise<boolean> => {
  const content = await partnerCopyEmail(row);
  const outcome = await sendMail({
    emailType: "partner.agreement_accepted",
    to: row.signerEmail,
    ...content,
    idempotencyKey: `partner-agreement-accepted-${row.id}`,
  });
  return wasDelivered(outcome);
};

const notifyOperators = async (
  row: AcceptedPartnerContract,
  partnerCopySent: boolean,
): Promise<void> => {
  const content = await newSaleEmail({
    subject: `Partnervereinbarung angenommen: ${row.partnerCompany}`,
    title: "Partnervereinbarung angenommen",
    rows: [
      ["Vereinbarung", partnerContractReference(row.id)],
      ["Partner", row.partnerCompany],
      ["Angenommen von", `${row.signerName}, ${row.signerEmail}`],
      ["Provision", commissionLine(row, "de")],
      ["Angenommen am", formatPartnerContractDate(row.signedAt, "de", true)],
      ["Zugang", OPERATOR_ACCESS[row.accessOutcome ?? "none"]],
      [
        "Bestätigung",
        partnerCopySent
          ? "an den Partner gesendet"
          : "NICHT gesendet, bitte von Hand schicken",
      ],
      ["Angeboten von", row.createdByEmail],
    ],
    adminUrl: `${getAppUrl()}/platform-admin`,
  });
  const admins = [
    ...new Set([...getPlatformAdminEmails(), row.createdByEmail.toLowerCase()]),
  ];
  await deliverToOperators(
    admins,
    (to) =>
      sendMail({ emailType: "internal.partner_agreement_accepted", to, ...content }),
    "partner agreement notice",
  );
};

export async function sendPartnerContractAcceptedMails(
  row: AcceptedPartnerContract,
): Promise<{ readonly partnerCopySent: boolean }> {
  // In turn, not together: the operators' notice says whether the partner's copy actually left.
  const partnerCopySent = await sendPartnerCopy(row).catch((err) => {
    console.error("[partner-contract] partner copy not sent", err);
    return false;
  });
  await notifyOperators(row, partnerCopySent).catch((err) =>
    console.error("[partner-contract] operator notice not sent", err),
  );
  return { partnerCopySent };
}
