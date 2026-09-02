/**
 * Erasure certificate. Renders a durable {@link dataErasureLog} row into a
 * human-readable Markdown record. This is the artifact an operator downloads
 * and attaches to the Art. 12(3) confirmation sent to the data subject, and
 * the accountability proof (Art. 5(2)/24) that the request was honoured.
 */
import type { InferSelectModel } from "drizzle-orm";
import { dataErasureLog } from "@/schema";
import type { ErasureScope } from "@/schema";

export type ErasureLogRow = InferSelectModel<typeof dataErasureLog>;

export function erasureCertificateFilename(row: Pick<ErasureLogRow, "caseRef">): string {
  return `${row.caseRef}-erasure-certificate.md`;
}

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "n/a";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

/** Neutralise markdown / table / HTML control chars in interpolated values so a
 *  crafted name, company, or free-text field cannot break the table layout or
 *  inject markup into the rendered certificate. */
function esc(v: string | null | undefined): string {
  if (v == null || String(v).trim() === "") return "n/a";
  return String(v)
    .replace(/[\r\n]+/g, " ")
    .replace(/\|/g, "\\|")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/`/g, "'");
}

function fmtCounts(rec: Record<string, number>): string {
  const keys = Object.keys(rec);
  if (keys.length === 0) return "_none_";
  return keys
    .sort()
    .map((k) => `- \`${esc(k)}\`: ${rec[k]}`)
    .join("\n");
}

export function buildErasureCertificate(row: ErasureLogRow): string {
  const scope = row.scope as ErasureScope;
  const methodLabel =
    row.method === "hard_delete"
      ? "Complete deletion (no retained-evidence footprint)"
      : "Deletion with anonymisation of tamper-evident and tenant records";

  return `Hello,

Confirming that your account and all associated personal data have been deleted,
as you requested. The formal record is below. If anything's unclear, reply here
or to contact@nisd2.eu quoting the case reference (${esc(row.caseRef)}).

Best regards,
NISD2

---

# Data Erasure Certificate

**Case reference:** ${esc(row.caseRef)}
**Controller:** Simon Orzel, Köln. Contact: contact@nisd2.eu

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

Before execution, the operator confirmed the target account by re-entering its
email, which matched our records. Requester identity is verified by the operator
at intake per our procedure. No fee was charged (Art. 12(5)).

## Action taken

**Method:** ${methodLabel}
**Executed:** ${fmtDate(row.erasedAt)} by ${esc(row.actorEmail)}
**Company teardown:** ${row.companyTornDown ? "Yes. The subject was the sole member, so the company and all its tenant data were deleted." : "No"}

### Data categories and systems cleared
${scope.systemsCleared.length ? scope.systemsCleared.map((s) => `- ${esc(s)}`).join("\n") : "_none recorded_"}

### Records deleted (row counts by table)
${fmtCounts(scope.deleted)}

### Records anonymised (subject identity severed, record retained)
${fmtCounts(scope.anonymized)}

### Processors and sub-processors
Your data was processed only within our own systems and standard operational logs. Beyond the sub-processors listed below, which hold copies under our Article 28 agreements and delete it as part of this erasure and on their standard backup-retention cycle, it was not disclosed to any separate third-party recipient, so no separate Article 19 recipient notification was required.
${scope.processorsInScope.length ? scope.processorsInScope.map((p) => `- ${esc(p)}`).join("\n") : "_none_"}

${scope.residualNotes.length ? `### Notes\n${scope.residualNotes.map((n) => `- ${esc(n)}`).join("\n")}\n` : ""}

## Article 17(3) exceptions

Assessed. No exception applies: the account was not processed for journalism,
public-interest, or scientific-research purposes, and no legal-retention duty
attaches to it. Erasure was carried out in full.

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
