/**
 * Update schemas are the only thing standing between a caller-supplied object
 * and a row write. These pin the fields that must never survive parsing.
 *
 * Zod strips unknown keys by default, so "rejected" here means the key is
 * absent from the parsed output — the router then cannot write it.
 */
import { describe, expect, test } from "bun:test";
import {
  incidentUpdateSchema,
  patchRecordUpdateSchema,
  policyUpdateSchema,
  riskUpdateSchema,
  supplierUpdateSchema,
  trainingUpdateSchema,
} from "./validators";

describe("supplierUpdateSchema", () => {
  // unsubscribeToken is the portal's bearer credential: holding it grants read
  // access to the supplier's data and the right to revoke the relationship.
  test("drops the portal bearer token", () => {
    const parsed = supplierUpdateSchema.parse({
      name: "Acme",
      unsubscribeToken: "a".repeat(64),
    });
    expect(parsed).not.toHaveProperty("unsubscribeToken");
    expect(parsed.name).toBe("Acme");
  });

  test("drops both sides of the relationship identity", () => {
    const parsed = supplierUpdateSchema.parse({
      name: "Acme",
      supplierCompanyId: "11111111-1111-1111-1111-111111111111",
      customerCompanyId: "22222222-2222-2222-2222-222222222222",
    });
    expect(parsed).not.toHaveProperty("supplierCompanyId");
    expect(parsed).not.toHaveProperty("customerCompanyId");
  });

  // A customer able to set these can undo a revocation the supplier performed.
  test("drops the supplier-controlled lifecycle", () => {
    const parsed = supplierUpdateSchema.parse({
      name: "Acme",
      status: "active",
      confirmedAt: new Date(),
      unsubscribedAt: null,
    });
    for (const k of ["status", "confirmedAt", "unsubscribedAt"]) {
      expect(parsed).not.toHaveProperty(k);
    }
  });

  test("still accepts the fields a supplier edit actually posts", () => {
    const parsed = supplierUpdateSchema.parse({ name: "Acme", isCritical: true });
    expect(parsed).toEqual({ name: "Acme", isCritical: true });
  });
});

describe("trainingUpdateSchema", () => {
  test("drops companyId", () => {
    const parsed = trainingUpdateSchema.parse({
      title: "NIS2 Basics",
      companyId: "33333333-3333-3333-3333-333333333333",
    });
    expect(parsed).not.toHaveProperty("companyId");
    expect(parsed.title).toBe("NIS2 Basics");
  });
});

describe("riskUpdateSchema", () => {
  // The sign-off on a residual risk: the router stamps who and when from the session.
  test("drops who accepted the risk and when", () => {
    const parsed = riskUpdateSchema.parse({
      title: "Ransomware",
      acceptedBy: "44444444-4444-4444-4444-444444444444",
      acceptedAt: new Date(),
    });
    expect(parsed).not.toHaveProperty("acceptedBy");
    expect(parsed).not.toHaveProperty("acceptedAt");
    expect(parsed.title).toBe("Ransomware");
  });
});

describe("incidentUpdateSchema", () => {
  test("drops createdBy", () => {
    const parsed = incidentUpdateSchema.parse({
      title: "Phishing",
      createdBy: "55555555-5555-5555-5555-555555555555",
    });
    expect(parsed).not.toHaveProperty("createdBy");
    expect(parsed.title).toBe("Phishing");
  });
});

describe("policyUpdateSchema", () => {
  // A member naming a real Geschäftsführer, back-dated, passes any membership check.
  test("drops the approver, the approval date and the approver's role", () => {
    const parsed = policyUpdateSchema.parse({
      title: "IT-Sicherheitsleitlinie",
      approvedBy: "66666666-6666-6666-6666-666666666666",
      approvedAt: new Date("2026-01-01T00:00:00.000Z"),
      approverRole: "geschaeftsfuehrer",
    });
    for (const k of ["approvedBy", "approvedAt", "approverRole"]) {
      expect(parsed).not.toHaveProperty(k);
    }
    expect(parsed.title).toBe("IT-Sicherheitsleitlinie");
  });
});

describe("patchRecordUpdateSchema", () => {
  test("drops who approved the exception", () => {
    const parsed = patchRecordUpdateSchema.parse({
      exceptionReason: "Vendor patch breaks the SCADA client",
      exceptionApprovedBy: "77777777-7777-7777-7777-777777777777",
    });
    expect(parsed).not.toHaveProperty("exceptionApprovedBy");
    expect(parsed.exceptionReason).toBe("Vendor patch breaks the SCADA client");
  });
});
