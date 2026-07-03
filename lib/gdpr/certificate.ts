/**
 * Erasure certificate — renders a durable {@link dataErasureLog} row into a
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
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

function fmtCounts(rec: Record<string, number>): string {
  const keys = Object.keys(rec);
  if (keys.length === 0) return "_none_";
  return keys
    .sort()
    .map((k) => `- \`${k}\`: ${rec[k]}`)
    .join("\n");
}

export function buildErasureCertificate(row: ErasureLogRow): string {
  const scope = row.scope as ErasureScope;
  const methodLabel =
    row.method === "hard_delete"
      ? "Complete deletion (no retained-evidence footprint)"
      : "Deletion with anonymisation of tamper-evident / tenant records";

  return `# Data Erasure Certificate

**Case reference:** ${row.caseRef}
**Controller:** Kardashev Catalyst UG (haftungsbeschränkt), Köln — contact@nisd2.eu

This document records the erasure of personal data carried out under the EU
General Data Protection Regulation (GDPR), Article 17 (right to erasure).

## Data subject

| Field | Value |
|---|---|
| Name | ${row.subjectName ?? "—"} |
| Email | ${row.subjectEmail ?? "(cleared — see retention)"} |
| Email fingerprint (SHA-256) | \`${row.subjectEmailHash}\` |
| Internal account ID | \`${row.subjectUserId}\` |
| Company at erasure time | ${row.companyName ?? row.companyId ?? "none"} |

## Request

| Field | Value |
|---|---|
| Received | ${fmtDate(row.requestReceivedAt)} |
| Channel | ${row.requestChannel ?? "—"} |
| Rights invoked | ${row.rightsInvoked ?? "—"} |
| Legal basis applied | ${row.legalBasis ?? "—"} |

Before execution, the operator confirmed the target account by re-entering its
email, which matched our records. Requester identity is verified by the operator
at intake per our procedure. No fee was charged (Art. 12(5)).

## Action taken

**Method:** ${methodLabel}
**Executed:** ${fmtDate(row.erasedAt)} by ${row.actorEmail}
**Company teardown:** ${row.companyTornDown ? "Yes — the subject was the sole member; the company and all its tenant data were deleted." : "No"}

### Data categories / systems cleared
${scope.systemsCleared.length ? scope.systemsCleared.map((s) => `- ${s}`).join("\n") : "_none recorded_"}

### Records deleted (row counts by table)
${fmtCounts(scope.deleted)}

### Records anonymised (subject identity severed, record retained)
${fmtCounts(scope.anonymized)}

### Processors in scope for Art. 19 deletion
The following processors may hold copies and are to be instructed to delete. This lists recipients; it does not assert an automated notification was sent.
${scope.processorsInScope.length ? scope.processorsInScope.map((p) => `- ${p}`).join("\n") : "_none_"}

${scope.residualNotes.length ? `### Notes\n${scope.residualNotes.map((n) => `- ${n}`).join("\n")}\n` : ""}

## Article 17(3) exceptions

Assessed. No exception applies: the account was not processed for journalism,
public-interest, or scientific-research purposes, and no legal-retention duty
attaches to it. Erasure was carried out in full.

## What was retained, and why

A minimal accountability record — this certificate and its underlying log
entry (case reference, email fingerprint, request metadata, and the scope
above) — is retained to demonstrate that the request was honoured
(GDPR Art. 5(2) and Art. 24, supported by Art. 6(1)(f)).

**Retention of this record:** until ${fmtDate(row.retentionUntil)}. After that
date the raw email is minimised, leaving only the pseudonymous fingerprint.

## Integrity

**Record checksum (SHA-256):** \`${row.checksum}\`

## Your rights

You may lodge a complaint with the competent supervisory authority — LDI NRW
(Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein-Westfalen,
https://www.ldi.nrw.de) — and you have the right to a judicial remedy
(Art. 12(4), Art. 77). For any follow-up, contact contact@nisd2.eu quoting the
case reference above.
`;
}
