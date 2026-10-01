/**
 * The certificate is sent to the person whose data was erased. It said all of
 * it was deleted while a torn-down organization's files stayed in the bucket,
 * so it now claims complete deletion only when the file deletion is recorded
 * as complete.
 */
import { describe, expect, test } from "bun:test";
import {
  buildErasureCertificate,
  type ErasureLogRow,
  SELF_SERVICE_ACTOR,
  SELF_SERVICE_CHANNEL,
} from "./certificate";

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
    [
      "files passed on for manual deletion",
      { kind: "manual", deleted: 3, pendingPrefixes: ["evidence/x/"] },
    ],
    [
      "retries over and no operator reached yet",
      { kind: "outstanding", deleted: 3, pendingPrefixes: ["evidence/x/"] },
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
    expect(text).toContain("retried daily for up to 14 days");
  });

  // Retrying stops after the window, so the certificate must stop saying it goes on.
  test("a deletion passed to an operator says so, and no longer promises retries", () => {
    const text = buildErasureCertificate(row(true), {
      kind: "manual",
      deleted: 3,
      pendingPrefixes: ["evidence/x/"],
    });
    expect(text).toContain("passed to an operator for deletion by hand");
    expect(text).not.toContain("retried daily");
  });

  // The operator mail may not have gone out (no admin address, mail off).
  test("an outstanding deletion claims neither retries nor an operator", () => {
    const text = buildErasureCertificate(row(true), {
      kind: "outstanding",
      deleted: 3,
      pendingPrefixes: ["evidence/x/"],
    });
    expect(text).toContain("Their deletion is not complete.");
    expect(text).not.toContain("passed to an operator");
    expect(text).not.toContain("retried daily");
  });

  test("a self-service erasure says the account holder confirmed it, not an operator", () => {
    const selfService = {
      ...row(false),
      requestChannel: SELF_SERVICE_CHANNEL,
      actorEmail: SELF_SERVICE_ACTOR,
    };
    const text = buildErasureCertificate(selfService, { kind: "not_applicable" });
    expect(text).toContain("The account holder requested the erasure while signed in");
    expect(text).not.toContain("the operator confirmed");
    expect(text).toContain(`by ${SELF_SERVICE_ACTOR}`);
  });

  test("an operator erasure keeps the operator's confirmation", () => {
    const text = buildErasureCertificate(row(false), { kind: "not_applicable" });
    expect(text).toContain("the operator confirmed the target account");
  });

  test("the operator's address never reaches the copy sent to the person", () => {
    const text = buildErasureCertificate(row(false), { kind: "not_applicable" });
    expect(text).not.toContain("operator@example.test");
    expect(text).toContain("by an operator of nisd2.eu");
  });

  test("a company name cannot carry a link or an image into the file", () => {
    const named = {
      ...row(false),
      companyName: "Kunde ![x](https://t.example/p.png) [klick](https://evil.example)",
    };
    const text = buildErasureCertificate(named, { kind: "not_applicable" });
    // Only an unescaped "](" opens a link target.
    expect(text).not.toMatch(/(?<!\\)\]\(/);
    expect(text).toContain("\\[klick\\]");
  });
});
