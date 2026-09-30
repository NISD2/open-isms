/**
 * `updateRequirementStatus` is the hand-set status change. It must not touch a
 * requirement a reviewer approved (reopenRequirement is the way out of that),
 * and it must not accept needs_review, which only the deadline cron writes.
 */
import { describe, expect, mock, test } from "bun:test";

// The auto-audit middleware would otherwise reach for a real database.
mock.module("@/lib/audit", () => ({ logAudit: async () => {} }));

const { createCallerFactory } = await import("../init");
const { assessmentRouter } = await import("./assessment");
type TRPCContext = import("../init").TRPCContext;

const COMPANY = "company-1";
const USER = "11111111-1111-4111-8111-111111111111";
const STATUS = "22222222-2222-4222-8222-222222222222";

function setup(currentStatus: string, role: "admin" | "member" = "admin") {
  const writes: unknown[] = [];
  const reads: string[] = [];
  const db = {
    query: {
      companyRequirementStatus: {
        findFirst: async () => {
          reads.push("status");
          return {
            id: STATUS,
            assessmentId: "assessment-1",
            status: currentStatus,
            requirement: { id: "requirement-1", categoryId: "category-1" },
          };
        },
      },
      companyAssessment: { findFirst: async () => ({ frameworkId: "framework-1" }) },
      // The member in these tests owns the category, so only the status rule
      // stands between them and the write.
      categoryAssignment: { findFirst: async () => ({ id: "assignment-1" }) },
    },
    update: () => ({
      set: (values: unknown) => ({
        where: () => ({
          returning: async () => {
            writes.push(values);
            return [];
          },
        }),
      }),
    }),
  };
  const caller = createCallerFactory(assessmentRouter)({
    db: db as unknown as TRPCContext["db"],
    session: { role, accessLevel: "full", jobTitle: null } as TRPCContext["session"],
    userId: USER,
    companyId: COMPANY,
    ip: "test",
    userAgent: null,
  } as TRPCContext);
  return { caller, writes, reads };
}

describe("assessment.updateRequirementStatus", () => {
  test("refuses to overwrite an approved requirement, even for an admin", async () => {
    const { caller, writes } = setup("approved");
    await expect(
      caller.updateRequirementStatus({ statusId: STATUS, status: "in_progress" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(writes).toEqual([]);
  });

  test("refuses to mark an approved requirement not applicable", async () => {
    const { caller, writes } = setup("approved", "member");
    await expect(
      caller.updateRequirementStatus({
        statusId: STATUS,
        status: "not_applicable",
        notApplicableReason: "No suppliers",
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(writes).toEqual([]);
  });

  test("refuses needs_review as a target before reading anything", async () => {
    const { caller, writes, reads } = setup("completed");
    const input = { statusId: STATUS, status: "needs_review" };
    await expect(
      caller.updateRequirementStatus(
        input as unknown as Parameters<typeof caller.updateRequirementStatus>[0],
      ),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(reads).toEqual([]);
    expect(writes).toEqual([]);
  });
});
