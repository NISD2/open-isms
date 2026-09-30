/**
 * `updateRequirementStatus` is the hand-set status change. It must not touch a
 * requirement a reviewer approved (reopenRequirement is the way out of that),
 * including one approved after the procedure read the row, and it must not
 * accept needs_review, which only the deadline cron writes.
 */
import { describe, expect, mock, test } from "bun:test";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { companyRequirementStatus } from "@/schema";

// The auto-audit middleware would otherwise reach for a real database.
mock.module("@/lib/audit", () => ({ logAudit: async () => {} }));

const { createCallerFactory } = await import("../init");
const { assessmentRouter } = await import("./assessment");
const { REOPEN_APPROVED_FIRST } = await import("../helpers/manual-status");
type TRPCContext = import("../init").TRPCContext;

const COMPANY = "company-1";
const USER = "11111111-1111-4111-8111-111111111111";
const STATUS = "22222222-2222-4222-8222-222222222222";

/**
 * `readStatus` is what the procedure reads first; `rowStillMatches` is whether
 * the guarded UPDATE finds the row, which is false once it is approved.
 */
function setup(opts: {
  readStatus: string;
  rowStillMatches: boolean;
  role?: "admin" | "member";
}) {
  const statusWrites: { values: unknown; where: SQL }[] = [];
  const reads: string[] = [];
  const db = {
    query: {
      companyRequirementStatus: {
        findFirst: async () => {
          reads.push("status");
          return {
            id: STATUS,
            assessmentId: "assessment-1",
            status: opts.readStatus,
            requirement: { id: "requirement-1", categoryId: "category-1" },
          };
        },
        // recalculateProgress, after a write that went through.
        findMany: async () => [],
      },
      companyAssessment: { findFirst: async () => ({ frameworkId: "framework-1" }) },
      // The member in these tests owns the category, so only the status rule
      // stands between them and the write.
      categoryAssignment: { findFirst: async () => ({ id: "assignment-1" }) },
    },
    update: (table: unknown) => ({
      set: (values: unknown) => ({
        where: (where: SQL) => ({
          returning: async () => {
            if (table !== companyRequirementStatus) return [];
            statusWrites.push({ values, where });
            return opts.rowStillMatches
              ? [{ id: STATUS, assessmentId: "assessment-1" }]
              : [];
          },
        }),
      }),
    }),
  };
  const caller = createCallerFactory(assessmentRouter)({
    db: db as unknown as TRPCContext["db"],
    session: {
      role: opts.role ?? "admin",
      accessLevel: "full",
      jobTitle: null,
    } as TRPCContext["session"],
    userId: USER,
    companyId: COMPANY,
    ip: "test",
    userAgent: null,
  } as TRPCContext);
  return { caller, statusWrites, reads };
}

describe("assessment.updateRequirementStatus", () => {
  test("guards the write itself against an approved row", async () => {
    const { caller, statusWrites } = setup({
      readStatus: "not_started",
      rowStillMatches: true,
    });
    await caller.updateRequirementStatus({ statusId: STATUS, status: "in_progress" });
    expect(statusWrites).toHaveLength(1);
    const { params } = new PgDialect().sqlToQuery(statusWrites[0].where);
    expect(params).toContain("approved");
  });

  test("refuses an approved requirement, even for an admin", async () => {
    const { caller } = setup({ readStatus: "approved", rowStillMatches: false });
    await expect(
      caller.updateRequirementStatus({ statusId: STATUS, status: "in_progress" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN", message: REOPEN_APPROVED_FIRST });
  });

  // The race: the row read as in progress, then a reviewer approved it before
  // the write. The guarded UPDATE matches nothing and the caller is told so.
  test("refuses when an approval lands between the read and the write", async () => {
    const { caller } = setup({
      readStatus: "in_progress",
      rowStillMatches: false,
      role: "member",
    });
    await expect(
      caller.updateRequirementStatus({
        statusId: STATUS,
        status: "not_applicable",
        notApplicableReason: "No suppliers",
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN", message: REOPEN_APPROVED_FIRST });
  });

  test("refuses needs_review as a target before reading anything", async () => {
    const { caller, statusWrites, reads } = setup({
      readStatus: "completed",
      rowStillMatches: true,
    });
    const input = { statusId: STATUS, status: "needs_review" };
    await expect(
      caller.updateRequirementStatus(
        input as unknown as Parameters<typeof caller.updateRequirementStatus>[0],
      ),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(reads).toEqual([]);
    expect(statusWrites).toEqual([]);
  });
});
