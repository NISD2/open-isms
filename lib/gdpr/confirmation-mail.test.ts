/**
 * The erasure email summarises the certificate in the person's language. It may never claim more
 * than the record does: complete deletion only when the stored files are recorded as deleted, and
 * "kept by law" whenever the record lists an Article 17(3) exception. The certificate file itself
 * stays the letter followed by the record.
 */
import { describe, expect, mock, test } from "bun:test";

mock.module("@/lib/env", () => ({
  env: {
    DATABASE_URL: "postgres://unused:unused@localhost:5432/unused",
    AUTH_SECRET: "test-secret-test-secret-test-secret",
  },
  mailSupportEmail: () => "support@example.test",
}));

const { buildErasureCertificate, erasureCoverLetter, erasureRecord } = await import(
  "./certificate"
);
const { erasureConfirmationWording } = await import("./confirmation-mail");
const { renderRecordMarkdown } = await import("@/lib/mail/markdown");
const { documentEmail } = await import("@/lib/mail/templates");

type Row = Parameters<typeof erasureRecord>[0];
type Files = Parameters<typeof erasureRecord>[1];

const erasedAt = new Date("2026-10-01T10:00:00.000Z");
const row = (retainedUnderLegalDuty?: string[]): Row => ({
  id: "33333333-3333-4333-8333-333333333333",
  caseRef: "ERASURE-2026-0007",
  subjectUserId: "11111111-1111-4111-8111-111111111111",
  subjectEmail: "anna@kunde.example",
  subjectEmailHash: "a".repeat(64),
  subjectName: "Anna Muster",
  companyId: "22222222-2222-4222-8222-222222222222",
  companyName: "Kunde GmbH",
  requestReceivedAt: erasedAt,
  requestChannel: "self_service",
  rightsInvoked: "Right to erasure (Art. 17)",
  legalBasis: "GDPR Art. 17(1)(a), 17(1)(b)",
  erasedAt,
  actorUserId: null,
  actorEmail: "the account holder (self-service)",
  method: "hard_delete",
  companyTornDown: true,
  scope: {
    deleted: { user: 1 },
    anonymized: {},
    systemsCleared: [],
    processorsInScope: [],
    companyTornDown: true,
    residualNotes: [],
    ...(retainedUnderLegalDuty ? { retainedUnderLegalDuty } : {}),
  },
  notes: null,
  retentionUntil: new Date("2029-10-01T10:00:00.000Z"),
  checksum: "b".repeat(64),
  createdAt: erasedAt,
});

const DONE: Files = { kind: "not_applicable" };
const RECORD = { html: "<p>record</p>", text: "record" };

const words = (r: Row, files: Files, locale: "de" | "en" | "nl" = "de") => {
  const mail = erasureConfirmationWording(r, files, locale, RECORD);
  return [
    mail.subject,
    ...mail.intro,
    ...mail.document.facts.flatMap((f) => [f.label, f.value, f.detail ?? ""]),
    ...mail.outro,
  ].join(" ");
};

describe("erasureConfirmationWording", () => {
  test("says everything was deleted only when nothing is kept and the files are done", () => {
    const all = words(row(), DONE);
    const kept = words(row(["Invoices issued to the organization"]), DONE);
    expect(all).toContain("alle personenbezogenen Daten");
    expect(all).toContain("mit allem gelöscht");
    expect(all).toContain("Nur dieser Nachweis");
    // The organization's invoices outlive it, so neither the account nor the organization is "all".
    expect(kept).not.toContain("alle personenbezogenen Daten");
    expect(kept).not.toContain("mit allem gelöscht");
    expect(kept).toContain("Was ein Gesetz verlangt");
  });

  test("files still being deleted are never called deleted", () => {
    const pending = words(row(), {
      kind: "pending",
      deleted: 3,
      pendingPrefixes: ["companies/a/", "companies/b/"],
    });
    expect(pending).toContain("noch nicht vollständig gelöscht");
    expect(pending).not.toContain("alle personenbezogenen Daten");
    // Every line agrees, the "kept" line included.
    expect(pending).not.toContain("Nur dieser Nachweis");
    expect(pending).toContain("Dateien, deren Löschung noch läuft");
  });

  test("names the case, the day and the account, in each language", () => {
    expect(words(row(), DONE, "de")).toContain("Gelöscht am 1. Oktober 2026");
    expect(words(row(), DONE, "en")).toContain("Deleted on 1 October 2026");
    expect(words(row(), DONE, "nl")).toContain("Verwijderd op 1 oktober 2026");
    expect(words(row(), DONE, "en")).toContain("anna@kunde.example");
  });

  test("carries the formal record below the signature", () => {
    expect(erasureConfirmationWording(row(), DONE, "de", RECORD).appendix).toEqual(
      RECORD,
    );
  });

  test("carries a licence the deletion cancelled after its own card, in the html and the text", async () => {
    const creditNote = {
      intro: [
        "Sie haben die Jahreslizenz NIS 2 Durchgang innerhalb der 30 Tage gekündigt.",
      ],
      document: {
        kind: "Gutschrift",
        reference: "GS-2026-0002",
        facts: [{ label: "Zahlung", value: "Nicht mehr nötig" }],
      },
      outro: ["Bei uns ist noch keine Zahlung eingegangen."],
    };
    const mail = erasureConfirmationWording(row(), DONE, "de", RECORD, [creditNote]);
    const { html, text } = await documentEmail(mail);
    for (const body of [html, text]) {
      const at = (s: string) => body.indexOf(s);
      expect(at("ERASURE-2026-0007")).toBeGreaterThan(-1);
      expect(at("ERASURE-2026-0007")).toBeLessThan(at("GS-2026-0002"));
      expect(at("GS-2026-0002")).toBeLessThan(at("steht unten auf Englisch"));
    }
  });
});

describe("the certificate file", () => {
  test("is the cover letter, a rule, then the record", () => {
    expect(buildErasureCertificate(row(), DONE)).toBe(
      `${erasureCoverLetter(row(), DONE)}\n---\n\n${erasureRecord(row(), DONE)}`,
    );
  });
});

describe("renderRecordMarkdown", () => {
  test("styles every table cell inline, because email clients drop style blocks", async () => {
    const html = await renderRecordMarkdown(erasureRecord(row(), DONE));
    expect(html).toContain("<table style=");
    expect(html).toContain("<td style=");
    expect(html).not.toContain("<style");
  });

  test("a company name cannot become a link in an email sent from our address", async () => {
    const planted = { ...row(), companyName: "Kunde GmbH www.phish.example/login" };
    const html = await renderRecordMarkdown(erasureRecord(planted, DONE));
    expect(html).toContain("www.phish.example/login");
    expect(html).not.toContain("<a ");
    expect(html).not.toContain("href=");
  });
});
