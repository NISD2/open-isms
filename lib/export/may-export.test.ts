/**
 * Who may export the company's records, and so read them through an assistant
 * (assistantExportProcedure) and download them (lib/export/access.ts).
 */
import { describe, expect, test } from "bun:test";
import { mayExport } from "./may-export";

describe("who may export", () => {
  test("whoever may read the audit trail", () => {
    for (const role of ["admin", "reviewer", "legal_reviewer"]) {
      expect(mayExport({ role })).toBe(true);
    }
  });

  test("management, whatever its role", () => {
    expect(mayExport({ role: "member", jobTitle: "ceo" })).toBe(true);
  });

  test("nobody else", () => {
    for (const session of [
      { role: "member" },
      { role: "member", jobTitle: null },
      { role: "member", jobTitle: "it_lead" },
      { role: "auditor" },
      { role: "" },
    ]) {
      expect(mayExport(session)).toBe(false);
    }
  });
});
