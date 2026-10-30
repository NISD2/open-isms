/**
 * `updateRequirementStatus` is the hand-set status change. It must not touch a
 * requirement that carries a sign-off or an approval (reopenRequirement is the
 * way out of that), including one signed after the procedure read the row. It
 * must not accept completed, which only a signature writes, nor needs_review,
 * which only the deadline cron writes. "Not applicable" takes a written reason
 * and the requirement's signer, and never on a duty the law leaves no choice on.
 */
import { describe, expect, mock, test } from "bun:test";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { companyRequirementStatus, requirementAssignment } from "@/schema";

// The auto-audit middleware would otherwise reach for a real database.
mock.module("@/lib/audit", () => ({ logAudit: async () => {} }));

const { createCallerFactory } = await import("../init");
const { assessmentRouter } = await import("./assessment");
const { REOPEN_APPROVED_FIRST, REOPEN_SIGNED_FIRST } = await import(
  "../helpers/manual-status"
);
type TRPCContext = import("../init").TRPCContext;

const COMPANY = "company-1";
const USER = "11111111-1111-4111-8111-111111111111";
const STATUS = "22222222-2222-4222-8222-222222222222";
const REASON = "We run no network and information systems of our own.";

/**
 * `readStatus` is what the procedure reads first; `rowStillMatches` is whether
 * the guarded UPDATE finds the row, which is false once it is signed or approved.
 */
function setup(opts: {
  readStatus: string;
  rowStillMatches: boolean;
  role?: "admin" | "member";
  jobTitle?: string | null;
  signedOffAt?: Date | null;
  code?: string;
  requiredSignOffRole?: string | null;
  /** Whether assigned signers still owe a signature (rosteredOf). */
  pendingSigners?: boolean;
}) {
  const statusWrites: { values: unknown; where: SQL }[] = [];
  const reads: string[] = [];
  const db = {
    select: () => ({
      from: () => ({
        where: async () => (opts.pendingSigners ? [{ statusId: STATUS }] : []),
      }),
    }),
    query: {
      companyRequirementStatus: {
        findFirst: async () => {
          reads.push("status");
          return {
            id: STATUS,
            assessmentId: "assessment-1",
            status: opts.readStatus,
            signedOffAt: opts.signedOffAt ?? null,
            requirement: {
              id: "requirement-1",
              categoryId: "category-1",
              code: opts.code ?? "5.1",
              requiredSignOffRole: opts.requiredSignOffRole ?? null,
            },
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
      jobTitle: opts.jobTitle ?? null,
    } as TRPCContext["session"],
    userId: USER,
    companyId: COMPANY,
    ip: "test",
    userAgent: null,
  } as TRPCContext);
  return { caller, statusWrites, reads };
}

type StatusInput = Parameters<
  ReturnType<typeof setup>["caller"]["updateRequirementStatus"]
>[0];

describe("assessment.updateRequirementStatus", () => {
  test("guards the write itself against a signed, approved or set-aside row", async () => {
    const { caller, statusWrites } = setup({
      readStatus: "not_started",
      rowStillMatches: true,
    });
    await caller.updateRequirementStatus({ statusId: STATUS, status: "in_progress" });
    expect(statusWrites).toHaveLength(1);
    const { sql, params } = new PgDialect().sqlToQuery(statusWrites[0].where);
    expect(params).toEqual(
      expect.arrayContaining(["completed", "approved", "not_applicable"]),
    );
    expect(sql).toContain('"signed_off_at" is null');
  });

  test("refuses an approved requirement, even for an admin", async () => {
    const { caller } = setup({ readStatus: "approved", rowStillMatches: false });
    await expect(
      caller.updateRequirementStatus({ statusId: STATUS, status: "in_progress" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN", message: REOPEN_APPROVED_FIRST });
  });

  // The module recheck leaves a signed row in needs_review with its signature;
  // a status set over it would leave that signature on a row reading otherwise.
  test("refuses a row that still carries a signature", async () => {
    const { caller, statusWrites } = setup({
      readStatus: "needs_review",
      signedOffAt: new Date("2026-09-01"),
      rowStillMatches: true,
    });
    await expect(
      caller.updateRequirementStatus({ statusId: STATUS, status: "in_progress" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN", message: REOPEN_SIGNED_FIRST });
    expect(statusWrites).toEqual([]);
  });

  // The race: the row read as in progress, then someone signed it before the
  // write. The guarded UPDATE matches nothing and the caller is told so.
  test("refuses when a sign-off lands between the read and the write", async () => {
    const { caller } = setup({
      readStatus: "in_progress",
      rowStillMatches: false,
      role: "member",
      jobTitle: "ciso",
    });
    await expect(
      caller.updateRequirementStatus({
        statusId: STATUS,
        status: "not_applicable",
        notApplicableReason: REASON,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN", message: REOPEN_SIGNED_FIRST });
  });

  test.each(["needs_review", "completed"])(
    "refuses %s as a target before reading anything",
    async (status) => {
      const { caller, statusWrites, reads } = setup({
        readStatus: "in_progress",
        rowStillMatches: true,
      });
      await expect(
        caller.updateRequirementStatus({
          statusId: STATUS,
          status,
        } as unknown as StatusInput),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
      expect(reads).toEqual([]);
      expect(statusWrites).toEqual([]);
    },
  );

  test("refuses not applicable without a reason that can stand as the record", async () => {
    const { caller, reads } = setup({ readStatus: "in_progress", rowStillMatches: true });
    await expect(
      caller.updateRequirementStatus({
        statusId: STATUS,
        status: "not_applicable",
        notApplicableReason: "No suppliers",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(reads).toEqual([]);
  });

  test("refuses not applicable on a duty the law leaves no choice on", async () => {
    const { caller, statusWrites } = setup({
      readStatus: "in_progress",
      rowStillMatches: true,
      jobTitle: "ceo",
      code: "7.3",
    });
    await expect(
      caller.updateRequirementStatus({
        statusId: STATUS,
        status: "not_applicable",
        notApplicableReason: REASON,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(statusWrites).toEqual([]);
  });

  // An admin without the requirement's role sets nothing aside in its place.
  test("refuses not applicable from someone without the requirement's role", async () => {
    const { caller, statusWrites } = setup({
      readStatus: "in_progress",
      rowStillMatches: true,
      role: "admin",
      requiredSignOffRole: "ceo",
    });
    await expect(
      caller.updateRequirementStatus({
        statusId: STATUS,
        status: "not_applicable",
        notApplicableReason: REASON,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(statusWrites).toEqual([]);
  });

  // One decision must not stand in for the signatures of the people assigned.
  test("refuses not applicable while assigned signers still owe a signature", async () => {
    const { caller, statusWrites } = setup({
      readStatus: "in_progress",
      rowStillMatches: true,
      jobTitle: "ceo",
      pendingSigners: true,
    });
    await expect(
      caller.updateRequirementStatus({
        statusId: STATUS,
        status: "not_applicable",
        notApplicableReason: REASON,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(statusWrites).toEqual([]);
  });

  test("records the reason and who set it aside", async () => {
    const { caller, statusWrites } = setup({
      readStatus: "in_progress",
      rowStillMatches: true,
      role: "member",
      jobTitle: "ciso",
    });
    await caller.updateRequirementStatus({
      statusId: STATUS,
      status: "not_applicable",
      notApplicableReason: `  ${REASON}  `,
    });
    expect(statusWrites[0].values).toMatchObject({
      status: "not_applicable",
      isApplicable: false,
      notApplicableReason: REASON,
      notApplicableBy: USER,
    });
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
  /** The signer rows the lock returns: an assigned roster, when given. */
  signers?: readonly { id: string; userId: string; signedOffAt: Date | null }[];
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
        // The billing state's lookup (signOffProcedure): no billing account, so a full session
        // reads as licensed and signs.
        innerJoin: () => ({ where: async () => [] }),
        where: () =>
          Object.assign(Promise.resolve([]), {
            for: async () => {
              steps.push({ step: "lock", table });
              if (table === companyRequirementStatus) {
                return [{ id: STATUS, signedOffBy: null, ...opts.locked }];
              }
              if (opts.stopAfterSignerLock) throw STOP;
              return opts.signers ?? [];
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

  // Being assigned says who signs, not that they may: an admin who put
  // themselves on the roster still needs the requirement's role.
  test("refuses an assigned signer who does not hold the role", async () => {
    const { caller, steps } = lockingSetup({
      readStatus: "in_progress",
      locked: { status: "in_progress", signedOffAt: null },
      role: "admin",
      signers: [{ id: "signer-1", userId: USER, signedOffAt: null }],
    });
    await expect(caller.signOff({ statusId: STATUS })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(steps.filter((s) => s.step === "update")).toEqual([]);
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

/**
 * The registration and reporting screens ask for the company's country where they need it
 * (CountryPicker). Before, they linked to the organization page, which has no country field, so a
 * company without one could never see its own authority.
 */
describe("assessment.updateCompany country", () => {
  function companySetup(session: { role: "admin" | "member"; accessLevel: string }) {
    const writes: unknown[] = [];
    const db = {
      query: {
        company: {
          findFirst: async () => ({ id: COMPANY, name: "Acme", contactEmail: null }),
        },
      },
      update: () => ({
        set: (values: unknown) => ({
          where: () => ({
            returning: async () => {
              writes.push(values);
              return [{ id: COMPANY, name: "Acme" }];
            },
          }),
        }),
      }),
    };
    const caller = createCallerFactory(assessmentRouter)({
      db: db as unknown as TRPCContext["db"],
      session: session as TRPCContext["session"],
      userId: USER,
      companyId: COMPANY,
      ip: "test",
      userAgent: null,
    } as TRPCContext);
    return { caller, writes };
  }

  test("an admin who has not ordered yet sets it, as registration is a free step", async () => {
    const { caller, writes } = companySetup({ role: "admin", accessLevel: "free" });
    await caller.updateCompany({ country: "AT" });
    expect(writes).toEqual([expect.objectContaining({ country: "AT" })]);
  });

  test("takes only a country on the portal list, by its two-letter code", async () => {
    const { caller, writes } = companySetup({ role: "admin", accessLevel: "full" });
    await expect(caller.updateCompany({ country: "at" })).rejects.toThrow();
    await expect(caller.updateCompany({ country: "Austria" })).rejects.toThrow();
    await expect(caller.updateCompany({ country: "US" })).rejects.toThrow();
    expect(writes).toEqual([]);
  });

  test("a member who is not an admin cannot change it", async () => {
    const { caller, writes } = companySetup({ role: "member", accessLevel: "full" });
    await expect(caller.updateCompany({ country: "AT" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(writes).toEqual([]);
  });
});
