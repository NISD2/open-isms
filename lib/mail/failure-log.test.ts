/**
 * A failed send is logged twice: to the container log, which erasure cannot
 * reach, and to audit_log, which the /platform-admin email page reads. The
 * full address may only be in the second, in the one field erasure scrubs.
 */
import { describe, expect, mock, spyOn, test } from "bun:test";
import type { AuditEntry } from "@/lib/audit";

const logged: AuditEntry[] = [];
// Full module shape: bun module mocks are process-global.
mock.module("@/lib/audit", () => ({
  logAudit: async (entry: AuditEntry) => {
    logged.push(entry);
  },
}));

const { recordEmailFailure } = await import("./failure-log");

describe("recordEmailFailure", () => {
  test("keeps full addresses out of the log line and the description", async () => {
    logged.length = 0;
    const errors = spyOn(console, "error").mockImplementation(() => {});
    try {
      await recordEmailFailure({
        emailType: "product.course_followup",
        recipient: "anna.muster@kunde.de, bernd@kunde.de",
        error: new Error("550 5.1.1 <anna.muster@kunde.de>: Recipient address rejected"),
      });
      const line = errors.mock.calls.flat().join(" ");
      expect(line).toContain("@kunde.de");
      expect(line).not.toContain("anna.muster@");
      expect(line).not.toContain("bernd@");

      expect(logged).toHaveLength(1);
      expect(logged[0]?.description).not.toContain("anna.muster@");
      // The admin email page needs the recipient; erasure scrubs it there.
      expect(logged[0]?.newValue).toEqual({
        recipient: "anna.muster@kunde.de, bernd@kunde.de",
      });
    } finally {
      errors.mockRestore();
    }
  });
});
