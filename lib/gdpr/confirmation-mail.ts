/**
 * The words of the email that confirms an erasure (Art. 12(3) GDPR): a short summary in the
 * person's language, on the same card the billing letters use, then the formal record in English
 * (./certificate), which also travels as the attached certificate file.
 *
 * The summary claims no more than the record does: complete deletion only when the stored files
 * are recorded as deleted, and "kept by law" whenever the record lists an Article 17(3) exception.
 */
import { formatInvoiceDay, invoiceToday } from "@/lib/billing/order";
import type { EmailLocale } from "@/lib/mail/locale";
import type { DocumentEmail, DocumentFact, DocumentSection } from "@/lib/mail/templates";
import { certificateFacts, type ErasureLogRow } from "./certificate";
import type { StoredFileState } from "./stored-files";

type Outcome = "all" | "kept_by_law" | "files_pending";

const COPY: Record<
  EmailLocale,
  {
    readonly subject: (caseRef: string) => string;
    readonly heading: string;
    readonly greeting: string;
    readonly intro: Record<Outcome, string>;
    readonly kind: string;
    readonly erasedOn: string;
    readonly account: string;
    readonly organization: string;
    readonly organizationDetail: Record<Outcome, string>;
    readonly kept: string;
    readonly keptValue: Record<Outcome, string>;
    readonly recordUntil: (day: string) => string;
    readonly outro: string;
  }
> = {
  de: {
    subject: (caseRef) => `Löschbestätigung ${caseRef}: Ihr Konto ist gelöscht`,
    heading: "Ihr Konto ist gelöscht",
    greeting: "Guten Tag,",
    intro: {
      all: "wir haben Ihr Konto und alle personenbezogenen Daten dazu gelöscht, wie Sie es angefordert haben.",
      kept_by_law:
        "wir haben Ihr Konto und die personenbezogenen Daten dazu gelöscht, wie Sie es angefordert haben. Was ein Gesetz uns aufzubewahren verpflichtet, steht unten.",
      files_pending:
        "wir haben Ihr Konto und die personenbezogenen Daten dazu in unserer Datenbank gelöscht, wie Sie es angefordert haben. Die gespeicherten Dateien Ihrer Organisation sind noch nicht vollständig gelöscht; den Stand finden Sie unten.",
    },
    kind: "Löschbestätigung",
    erasedOn: "Gelöscht am",
    account: "Konto",
    organization: "Organisation",
    organizationDetail: {
      all: "mit allem gelöscht, was darin eingetragen war",
      kept_by_law: "gelöscht, bis auf das, was ein Gesetz verlangt",
      files_pending: "Datenbank gelöscht, Dateien noch nicht vollständig",
    },
    kept: "Aufbewahrt",
    keptValue: {
      all: "Nur dieser Nachweis",
      kept_by_law: "Was ein Gesetz verlangt, siehe unten",
      files_pending:
        "Dieser Nachweis, dazu Dateien, deren Löschung noch läuft, siehe unten",
    },
    recordUntil: (day) => `Nachweis bis ${day}`,
    outro:
      "Die förmliche Bestätigung mit allen Einzelheiten steht unten auf Englisch und hängt als Datei an.",
  },
  en: {
    subject: (caseRef) => `Erasure confirmation ${caseRef}: your account is deleted`,
    heading: "Your account is deleted",
    greeting: "Hello,",
    intro: {
      all: "We have deleted your account and all personal data associated with it, as you requested.",
      kept_by_law:
        "We have deleted your account and its personal data, as you requested. What a law requires us to keep is listed below.",
      files_pending:
        "We have deleted your account and its personal data in our database, as you requested. Your organization's stored files are not fully deleted yet; their status is below.",
    },
    kind: "Erasure confirmation",
    erasedOn: "Deleted on",
    account: "Account",
    organization: "Organization",
    organizationDetail: {
      all: "deleted with everything entered in it",
      kept_by_law: "deleted, except what a law requires",
      files_pending: "database deleted, files not complete yet",
    },
    kept: "Kept",
    keptValue: {
      all: "Only this record",
      kept_by_law: "What a law requires, see below",
      files_pending: "This record, and files still being deleted, see below",
    },
    recordUntil: (day) => `Record kept until ${day}`,
    outro: "The formal record with every detail follows below and is attached as a file.",
  },
  nl: {
    subject: (caseRef) => `Verwijderingsbevestiging ${caseRef}: uw account is verwijderd`,
    heading: "Uw account is verwijderd",
    greeting: "Goedendag,",
    intro: {
      all: "Wij hebben uw account en alle bijbehorende persoonsgegevens verwijderd, zoals u heeft gevraagd.",
      kept_by_law:
        "Wij hebben uw account en de bijbehorende persoonsgegevens verwijderd, zoals u heeft gevraagd. Wat een wet ons verplicht te bewaren, staat hieronder.",
      files_pending:
        "Wij hebben uw account en de bijbehorende persoonsgegevens in onze database verwijderd, zoals u heeft gevraagd. De opgeslagen bestanden van uw organisatie zijn nog niet volledig verwijderd; de stand vindt u hieronder.",
    },
    kind: "Verwijderingsbevestiging",
    erasedOn: "Verwijderd op",
    account: "Account",
    organization: "Organisatie",
    organizationDetail: {
      all: "verwijderd met alles wat erin stond",
      kept_by_law: "verwijderd, behalve wat een wet vereist",
      files_pending: "database verwijderd, bestanden nog niet volledig",
    },
    kept: "Bewaard",
    keptValue: {
      all: "Alleen dit bewijs",
      kept_by_law: "Wat een wet vereist, zie hieronder",
      files_pending: "Dit bewijs, en bestanden die nog worden verwijderd, zie hieronder",
    },
    recordUntil: (day) => `Bewijs bewaard tot ${day}`,
    outro:
      "De formele bevestiging met alle details staat hieronder in het Engels en is als bestand bijgevoegd.",
  },
};

/**
 * The erasure confirmation, with `record` (the rendered formal record) under the signature, and
 * `enclosed` (the confirmation of a licence the deletion cancelled) after its card.
 */
export function erasureConfirmationWording(
  row: ErasureLogRow,
  files: StoredFileState,
  locale: EmailLocale,
  record: { readonly html: string; readonly text: string },
  enclosed: readonly DocumentSection[] = [],
): DocumentEmail {
  const copy = COPY[locale];
  const { filesDone, keptByLaw } = certificateFacts(row, files);
  const outcome: Outcome = !filesDone
    ? "files_pending"
    : keptByLaw.length > 0
      ? "kept_by_law"
      : "all";
  const day = (at: Date) => formatInvoiceDay(invoiceToday(at), locale);
  const facts: DocumentFact[] = [
    { label: copy.erasedOn, value: day(row.erasedAt) },
    ...(row.subjectEmail ? [{ label: copy.account, value: row.subjectEmail }] : []),
    ...(row.companyTornDown && row.companyName
      ? [
          {
            label: copy.organization,
            value: row.companyName,
            detail: copy.organizationDetail[outcome],
          },
        ]
      : []),
    {
      label: copy.kept,
      value: copy.keptValue[outcome],
      detail: copy.recordUntil(day(row.retentionUntil)),
    },
  ];
  return {
    locale,
    subject: copy.subject(row.caseRef),
    heading: copy.heading,
    greeting: copy.greeting,
    intro: [copy.intro[outcome]],
    document: { kind: copy.kind, reference: row.caseRef, facts },
    enclosed,
    outro: [copy.outro],
    appendix: record,
  };
}
