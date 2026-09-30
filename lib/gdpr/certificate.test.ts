/**
 * The certificate is sent to the person whose data was erased. It said all of
 * it was deleted while a torn-down organization's files stayed in the bucket,
 * so it now claims complete deletion only when the file deletion is recorded
 * as complete.
 */
import { describe, expect, test } from "bun:test";
import { buildErasureCertificate, type ErasureLogRow } from "./certificate";

const erasedAt = new Date("2026-09-30T10:00:00.000Z");

const row = (companyTornDown: boolean): ErasureLogRow => ({
  id: "33333333-3333-4333-8333-333333333333",
  caseRef: "ERASURE-2026-0007",
  subjectUserId: "11111111-1111-4111-8111-111111111111",
  subjectEmail: "anna@kunde.example",
  subjectEmailHash: "a".repeat(64),
  subjectName: "Anna Muster",
  companyId: "22222222-2222-4222-8222-222222222222",
  companyName: "Kunde GmbH",
  requestReceivedAt: erasedAt,
  requestChannel: "email",
  rightsInvoked: "Right to erasure (Art. 17)",
  legalBasis: "GDPR Art. 17(1)(a), 17(1)(b)",
  erasedAt,
  actorUserId: null,
  actorEmail: "operator@example.test",
  method: "hard_delete",
  companyTornDown,
  scope: {
    deleted: { user: 1 },
    anonymized: {},
    systemsCleared: [],
    processorsInScope: [],
    companyTornDown,
    residualNotes: [],
  },
  notes: null,
  retentionUntil: new Date("2029-09-30T10:00:00.000Z"),
  checksum: "b".repeat(64),
  createdAt: erasedAt,
});

const ALL_DELETED = "all associated personal data have been deleted";
const IN_FULL = "Erasure was carried out in full.";

describe("buildErasureCertificate", () => {
  test("an erasure without a teardown reads as before, with no file section", () => {
    const text = buildErasureCertificate(row(false), { kind: "not_applicable" });
    expect(text).toContain(ALL_DELETED);
    expect(text).toContain(IN_FULL);
    expect(text).not.toContain("### Stored files");
  });

  test("a teardown whose files are all deleted claims complete deletion", () => {
    const text = buildErasureCertificate(row(true), { kind: "complete", deleted: 12 });
    expect(text).toContain(ALL_DELETED);
    expect(text).toContain(IN_FULL);
    expect(text).toContain("### Stored files");
    expect(text).toContain("12 file(s)");
  });

  test.each([
    [
      "files outstanding",
      { kind: "pending", deleted: 3, pendingPrefixes: ["evidence/x/"] },
    ],
    ["no deletion recorded", { kind: "unrecorded" }],
  ] as const)("a teardown with %s does not claim more than was done", (_, files) => {
    const text = buildErasureCertificate(row(true), files);
    expect(text).not.toContain(ALL_DELETED);
    expect(text).not.toContain(IN_FULL);
    expect(text).toContain("personal data in our database");
    expect(text).toContain("### Stored files");
  });

  test("an outstanding deletion says how far it got and that it is retried", () => {
    const text = buildErasureCertificate(row(true), {
      kind: "pending",
      deleted: 3,
      pendingPrefixes: ["evidence/x/", "supplier-profile/x/"],
    });
    expect(text).toContain("3 file(s) deleted so far, 2 folder(s) outstanding");
    expect(text).toContain("retried daily");
  });
});
