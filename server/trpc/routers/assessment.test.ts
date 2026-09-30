/**
 * `updateRequirementStatus` is the hand-set status change. It must not touch a
 * requirement a reviewer approved (reopenRequirement is the way out of that),
 * including one approved after the procedure read the row, and it must not
 * accept needs_review, which only the deadline cron writes.
 */
import { describe, expect, mock, test } from "bun:test";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { companyRequirementStatus, requirementAssignment } from "@/schema";

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

/**
 * Sign-off and reopen write the status row and the signer rows. Both lock the
 * status row first, and reopen decides on the row as locked.
 */
type Step = { step: "lock" | "update" | "delete"; table: unknown; values?: unknown };

/** Thrown by the fake to stop a procedure once the locks under test are taken. */
const STOP = new Error("stop after the locks");

function lockingSetup(opts: {
  /** What the procedure reads before its transaction. */
  readStatus: string;
  /** What the status row holds once locked inside the transaction. */
  locked: { status: string; signedOffAt: Date | null };
  role: "admin" | "member";
  stopAfterSignerLock?: boolean;
}) {
  const steps: Step[] = [];
  const db = {
    query: {
      companyRequirementStatus: {
        findFirst: async () => ({
          id: STATUS,
          assessmentId: "assessment-1",
          status: opts.readStatus,
          signedOffBy: null,
          signedOffAt: null,
          requirement: {
            id: "requirement-1",
            code: "1.1",
            categoryId: "category-1",
            frequency: "annual",
            priority: "P0",
            templateVersion: 1,
            requiredSignOffRole: null,
          },
        }),
        // recalculateProgress, after a reopen.
        findMany: async () => [],
      },
      companyAssessment: {
        findFirst: async () => ({
          frameworkId: "framework-1",
          startedAt: new Date("2026-01-01"),
        }),
      },
      categoryAssignment: { findFirst: async () => ({ id: "assignment-1" }) },
    },
    select: () => ({
      from: (table: unknown) => ({
        where: () =>
          Object.assign(Promise.resolve([]), {
            for: async () => {
              steps.push({ step: "lock", table });
              if (table === companyRequirementStatus) {
                return [{ id: STATUS, signedOffBy: null, ...opts.locked }];
              }
              if (opts.stopAfterSignerLock) throw STOP;
              return [];
            },
          }),
      }),
    }),
    update: (table: unknown) => ({
      set: (values: unknown) => ({
        where: () => {
          steps.push({ step: "update", table, values });
          return Object.assign(Promise.resolve(), {
            returning: async () => [
              { id: STATUS, assessmentId: "assessment-1", status: "in_progress" },
            ],
          });
        },
      }),
    }),
    delete: (table: unknown) => ({
      where: async () => {
        steps.push({ step: "delete", table });
      },
    }),
    transaction: async <T>(fn: (tx: unknown) => Promise<T>) => fn(db),
  };
  const caller = createCallerFactory(assessmentRouter)({
    db: db as unknown as TRPCContext["db"],
    session: {
      role: opts.role,
      accessLevel: "full",
      jobTitle: null,
    } as TRPCContext["session"],
    userId: USER,
    companyId: COMPANY,
    ip: "test",
    userAgent: null,
  } as TRPCContext);
  return { caller, steps };
}

const lockedTables = (steps: Step[]) =>
  steps.filter((s) => s.step === "lock").map((s) => s.table);

describe("assessment.signOff", () => {
  test("locks the requirement status row before the signer rows", async () => {
    const { caller, steps } = lockingSetup({
      readStatus: "in_progress",
      locked: { status: "in_progress", signedOffAt: null },
      role: "admin",
      stopAfterSignerLock: true,
    });
    await expect(caller.signOff({ statusId: STATUS })).rejects.toThrow();
    expect(lockedTables(steps)).toEqual([
      companyRequirementStatus,
      requirementAssignment,
    ]);
  });
});

describe("assessment.reopenRequirement", () => {
  // Read as completed, approved by the time the lock is taken: a member may
  // not erase that approval.
  test("decides on the row as locked, not as first read", async () => {
    const { caller, steps } = lockingSetup({
      readStatus: "completed",
      locked: { status: "approved", signedOffAt: new Date("2026-09-01") },
      role: "member",
    });
    await expect(caller.reopenRequirement({ statusId: STATUS })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(steps.filter((s) => s.step !== "lock")).toEqual([]);
  });

  // The module recheck leaves a signed row in needs_review with its signature.
  test("reopens a needs_review requirement that still carries a signature", async () => {
    const { caller, steps } = lockingSetup({
      readStatus: "needs_review",
      locked: { status: "needs_review", signedOffAt: new Date("2026-09-01") },
      role: "member",
    });
    await caller.reopenRequirement({ statusId: STATUS });
    expect(steps[0]).toEqual({ step: "lock", table: companyRequirementStatus });
    expect(steps).toContainEqual({
      step: "update",
      table: requirementAssignment,
      values: { signedOffAt: null, signedOffRole: null },
    });
  });

  test("refuses a needs_review requirement with no signature to withdraw", async () => {
    const { caller } = lockingSetup({
      readStatus: "needs_review",
      locked: { status: "needs_review", signedOffAt: null },
      role: "admin",
    });
    await expect(caller.reopenRequirement({ statusId: STATUS })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });
});
