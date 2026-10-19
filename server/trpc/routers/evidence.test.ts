/**
 * `deleteEvidence` on a signed requirement takes away what the signature
 * rested on. The requirement goes back to needs_review, keeping the old
 * signature as the record, and the trail says why.
 */
import { describe, expect, mock, test } from "bun:test";
import { companyRequirementStatus } from "@/schema";

const audits: { action: string; description?: string }[] = [];
mock.module("@/lib/audit", () => ({
  logAudit: async (entry: { action: string; description?: string }) => {
    audits.push(entry);
  },
}));
// Only the bucket call is replaced; bun keeps a module mock for the whole run,
// so every other export stays the real one for the test files after this.
const storage = await import("@/lib/storage");
const deletedObjects: string[] = [];
mock.module("@/lib/storage", () => ({
  ...storage,
  deleteObject: async (key: string) => {
    deletedObjects.push(key);
  },
}));

const { createCallerFactory } = await import("../init");
const { evidenceRouter } = await import("./evidence");
type TRPCContext = import("../init").TRPCContext;

const EVIDENCE = "33333333-3333-4333-8333-333333333333";
const STATUS = "22222222-2222-4222-8222-222222222222";

function setup(status: string) {
  const statusWrites: unknown[] = [];
  const done = Object.assign(Promise.resolve(), { returning: async () => [] });
  const db = {
    query: {
      evidence: {
        findFirst: async () => ({
          id: EVIDENCE,
          requirementStatusId: STATUS,
          storageKey: "companies/company-1/evidence/file.pdf",
        }),
      },
      companyRequirementStatus: {
        findFirst: async () => ({
          id: STATUS,
          assessmentId: "assessment-1",
          status,
          requirement: { id: "requirement-1", categoryId: "category-1", code: "5.1" },
        }),
        // recalculateProgress
        findMany: async () => [],
      },
      companyAssessment: { findFirst: async () => ({ frameworkId: "framework-1" }) },
    },
    delete: () => ({ where: async () => {} }),
    update: (table: unknown) => ({
      set: (values: unknown) => ({
        where: () => {
          if (table !== companyRequirementStatus) return done;
          statusWrites.push(values);
          const signed = status === "completed" || status === "approved";
          return Object.assign(Promise.resolve(), {
            returning: async () => (signed ? [{ id: STATUS }] : []),
          });
        },
      }),
    }),
  };
  const caller = createCallerFactory(evidenceRouter)({
    db: db as unknown as TRPCContext["db"],
    session: {
      role: "admin",
      accessLevel: "full",
      jobTitle: null,
    } as TRPCContext["session"],
    userId: "11111111-1111-4111-8111-111111111111",
    companyId: "company-1",
    ip: "test",
    userAgent: null,
  } as TRPCContext);
  return { caller, statusWrites };
}

describe("evidence.deleteEvidence", () => {
  test.each(["completed", "approved"])(
    "sends a %s requirement back to needs review and logs it",
    async (status) => {
      audits.length = 0;
      const { caller, statusWrites } = setup(status);
      await caller.deleteEvidence({ evidenceId: EVIDENCE });
      expect(deletedObjects).toContain("companies/company-1/evidence/file.pdf");
      expect(statusWrites).toEqual([expect.objectContaining({ status: "needs_review" })]);
      expect(audits.map((a) => a.action)).toContain("requirement.sign_off_invalidated");
    },
  );

  test("leaves an unsigned requirement as it stands", async () => {
    audits.length = 0;
    const { caller } = setup("in_progress");
    await caller.deleteEvidence({ evidenceId: EVIDENCE });
    expect(audits.map((a) => a.action)).not.toContain("requirement.sign_off_invalidated");
  });
});
