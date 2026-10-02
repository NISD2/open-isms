/**
 * Erasure certificate. Renders a durable {@link dataErasureLog} row into a
 * human-readable Markdown record. This is the artifact an operator downloads
 * and attaches to the Art. 12(3) confirmation sent to the data subject, and
 * the accountability proof (Art. 5(2)/24) that the request was honoured.
 */
import type { InferSelectModel } from "drizzle-orm";
import type { dataErasureLog, ErasureScope } from "@/schema";
import { ERASURE_FILE_RETRY_DAYS, type StoredFileState } from "./stored-files";

export type ErasureLogRow = InferSelectModel<typeof dataErasureLog>;

/** The request channel of an erasure the account holder started from their own user menu. */
export const SELF_SERVICE_CHANNEL = "self_service";

/** Who erased it, as the record names them when the account holder did it themselves. */
export const SELF_SERVICE_ACTOR = "the account holder (self-service)";

/** How the request was confirmed: by the account holder signed in, or by an operator at intake. */
const verification = (row: Pick<ErasureLogRow, "requestChannel">): string =>
  row.requestChannel === SELF_SERVICE_CHANNEL
    ? `The account holder requested the erasure while signed in to the account and
confirmed it by re-entering the account's email, which matched our records.`
    : `Before execution, the operator confirmed the target account by re-entering its
email, which matched our records. Requester identity is verified by the operator
at intake per our procedure.`;

/**
 * Who carried it out, as the person reads it. The operator's address stays in the record and the
 * Erasures tab; printed on a copy that goes to every requester it would name the account that holds
 * platform-admin rights.
 */
const executedBy = (row: Pick<ErasureLogRow, "requestChannel">): string =>
  row.requestChannel === SELF_SERVICE_CHANNEL
    ? SELF_SERVICE_ACTOR
    : "an operator of nisd2.eu";

export function erasureCertificateFilename(row: Pick<ErasureLogRow, "caseRef">): string {
  return `${row.caseRef}-erasure-certificate.md`;
}

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "n/a";
  const date = typeof d === "string" ? new Date(d) : d;
  return `${date.toISOString().replace("T", " ").slice(0, 19)} UTC`;
}

/** Neutralise markdown / table / HTML control chars in interpolated values so a
 *  crafted name, company, or free-text field cannot break the table layout or
 *  inject markup into the rendered certificate. Square brackets too: without
 *  them there is no link or image syntax, so a company name set by its admin
 *  cannot carry one into the file. */
function esc(v: string | null | undefined): string {
  if (v == null || String(v).trim() === "") return "n/a";
  return String(v)
    .replace(/[\r\n]+/g, " ")
    .replace(/\|/g, "\\|")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/`/g, "'")
    .replace(/[[\]]/g, "\\$&");
}

function fmtCounts(rec: Record<string, number>): string {
  const keys = Object.keys(rec);
  if (keys.length === 0) return "_none_";
  return keys
    .sort()
    .map((k) => `- \`${esc(k)}\`: ${rec[k]}`)
    .join("\n");
}

const UPLOADED_FILES =
  "the organization's uploaded files (evidence documents, training certificates, supplier-portal certificates, policy files and its logo)";

/** The "Stored files" section, or nothing when no files were in scope. */
function storedFilesSection(files: StoredFileState): string {
  const section = (body: string) => `\n### Stored files\n${body}\n`;
  switch (files.kind) {
    case "not_applicable":
      return "";
    case "complete":
      return section(
        `All of ${UPLOADED_FILES} were deleted from file storage (AWS S3) after the database records: ${files.deleted} file(s).`,
      );
    case "pending":
      return section(
        `Not all of ${UPLOADED_FILES} had been deleted from file storage (AWS S3) when this record was issued: ${files.deleted} file(s) deleted so far, ${files.pendingPrefixes.length} folder(s) outstanding. The deletion is retried daily for up to ${ERASURE_FILE_RETRY_DAYS} days after the erasure, then passed to an operator.`,
      );
    case "outstanding":
      return section(
        `Not all of ${UPLOADED_FILES} have been deleted from file storage (AWS S3): ${files.deleted} file(s) deleted, ${files.pendingPrefixes.length} folder(s) outstanding. Their deletion is not complete.`,
      );
    case "manual":
      return section(
        `Not all of ${UPLOADED_FILES} could be deleted from file storage (AWS S3) automatically: ${files.deleted} file(s) deleted, ${files.pendingPrefixes.length} folder(s) outstanding after ${ERASURE_FILE_RETRY_DAYS} days of retries. The rest has been passed to an operator for deletion by hand.`,
      );
    case "unrecorded":
      return section(
        `No deletion of ${UPLOADED_FILES} from file storage (AWS S3) is recorded for this erasure.`,
      );
  }
}

/**
 * What the letter, the record and the email all depend on, decided once. `files` is what happened
 * to a torn-down organization's stored files, read at render time: they are deleted after the
 * checksummed record is written, so the record alone cannot say whether that finished, and
 * nothing claims complete deletion unless it did.
 */
export const certificateFacts = (row: ErasureLogRow, files: StoredFileState) => {
  const scope = row.scope as ErasureScope;
  return {
    scope,
    filesDone: files.kind === "not_applicable" || files.kind === "complete",
    // What a law requires us to keep (invoices): the record says so instead of claiming "all".
    keptByLaw: scope.retainedUnderLegalDuty ?? [],
  };
};

/**
 * The short letter above the record in the certificate file. The email writes its own summary in
 * the person's language instead, and shows only the record below it.
 */
export function erasureCoverLetter(row: ErasureLogRow, files: StoredFileState): string {
  const { filesDone, keptByLaw } = certificateFacts(row, files);
  const deleted = filesDone
    ? keptByLaw.length > 0
      ? "Confirming that your account and its personal data have been deleted, as you\nrequested."
      : "Confirming that your account and all associated personal data have been deleted,\nas you requested."
    : 'Confirming that your account and the associated personal data in our database\nhave been deleted, as you requested. The organization\'s stored files are covered\nunder "Stored files" below, because their deletion is not recorded as complete.';
  const confirmation =
    keptByLaw.length > 0
      ? `${deleted} What the law requires us to keep, such as invoices, is listed\nunder "Article 17(3) exceptions" below.`
      : deleted;
  return `Hello,

${confirmation} The formal record is below. If anything's unclear, reply here
or to contact@nisd2.eu quoting the case reference (${esc(row.caseRef)}).

Best regards,
NISD2
`;
}

/** The formal record of the erasure, in Markdown: the part the email shows under its summary. */
export function erasureRecord(row: ErasureLogRow, files: StoredFileState): string {
  const { scope, filesDone, keptByLaw } = certificateFacts(row, files);
  const methodLabel =
    row.method === "hard_delete"
      ? "Complete deletion (no retained-evidence footprint)"
      : "Deletion with anonymisation of tamper-evident and tenant records";
  const inFull = filesDone
    ? "Erasure was carried out in full."
    : 'Erasure of the database records was carried out in full; the stored files are as\ndescribed under "Stored files".';
  const exceptions =
    keptByLaw.length > 0
      ? `Assessed. One exception applies, Art. 17(3)(b) GDPR (compliance with a legal
obligation). The following is kept because a law requires it, for the period
stated:

${keptByLaw.map((item) => `- ${esc(item)}`).join("\n")}

Everything else is as recorded above.${filesDone ? "" : ' The stored files are as described under "Stored files".'}`
      : `Assessed. No exception applies: the account was not processed for journalism,
public-interest, or scientific-research purposes, and no legal-retention duty
attaches to it. ${inFull}`;

  return `# Data Erasure Certificate

- **Case reference:** ${esc(row.caseRef)}
- **Controller:** Kardashev Catalyst UG (haftungsbeschränkt), Köln. Contact: contact@nisd2.eu

This document records the erasure of personal data carried out under the EU
General Data Protection Regulation (GDPR), Article 17 (right to erasure).

## Data subject

| Field | Value |
|---|---|
| Name | ${esc(row.subjectName)} |
| Email | ${row.subjectEmail ? esc(row.subjectEmail) : "(minimised, see retention)"} |
| Email fingerprint (HMAC-SHA256) | \`${esc(row.subjectEmailHash)}\` |
| Internal account ID | \`${esc(row.subjectUserId)}\` |
| Company at erasure time | ${esc(row.companyName ?? row.companyId ?? "none")} |

## Request

| Field | Value |
|---|---|
| Received | ${fmtDate(row.requestReceivedAt)} |
| Channel | ${esc(row.requestChannel)} |
| Rights invoked | ${esc(row.rightsInvoked)} |
| Legal basis applied | ${esc(row.legalBasis)} |

${verification(row)} No fee was charged (Art. 12(5)).

## Action taken

- **Method:** ${methodLabel}
- **Executed:** ${fmtDate(row.erasedAt)} by ${executedBy(row)}
- **Company teardown:** ${row.companyTornDown ? `Yes. The subject owned the organization, so it and all its tenant data${filesDone ? "" : " in our database"} were deleted, together with every member account that belonged to no other organization.` : "No"}

### Data categories and systems cleared
${scope.systemsCleared.length ? scope.systemsCleared.map((s) => `- ${esc(s)}`).join("\n") : "_none recorded_"}

### Records deleted (row counts by table)
${fmtCounts(scope.deleted)}

### Records anonymised (subject identity severed, record retained)
${fmtCounts(scope.anonymized)}
${storedFilesSection(files)}
### Processors and sub-processors
Your data was processed only within our own systems and standard operational logs. Beyond the sub-processors listed below, which hold copies under our Article 28 agreements and delete it as part of this erasure and on their standard backup-retention cycle, it was not disclosed to any separate third-party recipient, so no separate Article 19 recipient notification was required.${keptByLaw.length > 0 ? ' Our invoicing provider Qonto keeps what is listed under "Article 17(3) exceptions" for that period; this erasure does not delete it there.' : ""}
${scope.processorsInScope.length ? scope.processorsInScope.map((p) => `- ${esc(p)}`).join("\n") : "_none_"}

${scope.residualNotes.length ? `### Notes\n${scope.residualNotes.map((n) => `- ${esc(n)}`).join("\n")}\n` : ""}

## Article 17(3) exceptions

${exceptions}

## What was retained, and why

A minimal accountability record is retained: this certificate and its
underlying log entry (case reference, email fingerprint, request metadata, and
the scope above). It demonstrates that the request was honoured (GDPR Art. 5(2)
and Art. 24, supported by Art. 6(1)(f)).

**Retention of this record:** until ${fmtDate(row.retentionUntil)}. After that
date the raw email is minimised, leaving only the pseudonymous fingerprint.

## Integrity

**Record checksum (SHA-256):** \`${esc(row.checksum)}\`

## Your rights

You may lodge a complaint with the competent supervisory authority, LDI NRW
(Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein-Westfalen,
https://www.ldi.nrw.de), and you have the right to a judicial remedy
(Art. 12(4), Art. 77). For any follow-up, contact contact@nisd2.eu quoting the
case reference above.
`;
}

/** The certificate file: the letter, then the record. Attached to the email, and the Erasures tab's copy. */
export function buildErasureCertificate(
  row: ErasureLogRow,
  files: StoredFileState,
): string {
  return `${erasureCoverLetter(row, files)}\n---\n\n${erasureRecord(row, files)}`;
}
