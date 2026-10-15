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
import {
  formatPartnerContractDate,
  type PartnerContractLocale,
  type PartnerContractReadingLocale,
} from "./date";
import { partnerContractText, partnerContractTranslator } from "./document";

type Row = typeof partnerContract.$inferSelect;

export interface AcceptedPartnerContract extends Row {
  readonly signedAt: Date;
  readonly signerName: string;
  readonly signerEmail: string;
}

/** A short reference both sides can quote: the first block of the row's id. */
export const partnerContractReference = (id: string): string =>
  `PV-${id.slice(0, 8).toUpperCase()}`;

/** The agreement's own words for the period, whose Czech plural tells one month from several. */
const czechPeriod = (months: number | null): string => {
  const t = partnerContractTranslator("cs");
  return months === null
    ? t("partnerContract.document.sections.commission.periodOngoing")
    : t("partnerContract.document.sections.commission.periodMonths", { months });
};

const commissionLine = (row: Row, locale: PartnerContractReadingLocale): string => {
  const months = row.commissionMonths;
  if (locale === "cs") return `${row.commissionPercent} %, ${czechPeriod(months)}`;
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

const GERMAN_LANGUAGE = new Intl.DisplayNames(["de"], { type: "language" });

/** The language the agreement was read in, as the operators read it: a translation names what binds. */
export const operatorReading = (
  reading: PartnerContractReadingLocale,
  binding: PartnerContractLocale,
): string => {
  const name = (code: string) => GERMAN_LANGUAGE.of(code) ?? code;
  return reading === binding
    ? name(reading)
    : `${name(reading)} (Übersetzung, verbindlich ist ${name(binding)})`;
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
  // Only ever around the English text: a Czech reader accepts the English offer, so the letter says
  // which text is below. "Dobrý den," stays bare: Czech greets by name in the vocative.
  cs: (row: AcceptedPartnerContract) => ({
    subject: `Partnerská smlouva s nisd2 přijata, ${partnerContractReference(row.id)}`,
    heading: "Partnerská smlouva přijata",
    greeting: "Dobrý den,",
    intro: [
      `děkujeme. Partnerská smlouva mezi ${row.partnerCompany} a nisd2 je přijata. Pod tímto e-mailem najdete její úplný text v anglickém znění, které je závazné.`,
    ],
    kind: "Partnerská smlouva",
    facts: [
      { label: "Partner", value: row.partnerCompany },
      { label: "Provize", value: commissionLine(row, "cs"), emphasis: true },
      { label: "Kdo přijal", value: `${row.signerName}, ${row.signerEmail}` },
      {
        label: "Přijato dne",
        value: formatPartnerContractDate(row.signedAt, "cs", true),
      },
    ],
    outro: [
      `Až nám doporučíte společnost, napište krátce na ${SELLER.email} s názvem společnosti a kontaktní osobou.`,
    ],
  }),
} as const satisfies Record<PartnerContractReadingLocale, unknown>;

/**
 * The partner's copy: the card with what was agreed, in the language the agreement was read in,
 * then the full text they accepted, which is the stored one whatever that language.
 */
export const partnerCopyEmail = async (
  row: AcceptedPartnerContract,
  locale: PartnerContractReadingLocale,
) => {
  const w = WORDING[locale](row);
  const text = partnerContractText(row.body);
  return documentEmail({
    locale,
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

const sendPartnerCopy = async (
  row: AcceptedPartnerContract,
  locale: PartnerContractReadingLocale,
): Promise<boolean> => {
  const content = await partnerCopyEmail(row, locale);
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
  locale: PartnerContractReadingLocale,
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
      ["Gelesen in", operatorReading(locale, row.locale)],
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

/** `locale` is the language the agreement was read and accepted in; the operators read German. */
export async function sendPartnerContractAcceptedMails(
  row: AcceptedPartnerContract,
  locale: PartnerContractReadingLocale,
): Promise<{ readonly partnerCopySent: boolean }> {
  // In turn, not together: the operators' notice says whether the partner's copy actually left.
  const partnerCopySent = await sendPartnerCopy(row, locale).catch((err) => {
    console.error("[partner-contract] partner copy not sent", err);
    return false;
  });
  await notifyOperators(row, locale, partnerCopySent).catch((err) =>
    console.error("[partner-contract] operator notice not sent", err),
  );
  return { partnerCopySent };
}
