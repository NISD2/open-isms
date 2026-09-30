/**
 * Intake saves move requirements: saving answers puts the requirements they
 * cover back in progress, and a signed one is reopened. So every save needs
 * the category owner or an admin, the category is the one the database names
 * for its id, a save cannot undo a reviewer's approval without review access,
 * and a reopen clears every signer's signature the way reopenRequirement does.
 */
import { describe, expect, mock, test } from "bun:test";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { REQUIREMENT_FIELD_MAP } from "@/lib/compliance/requirement-fields";
import {
  companyCategoryIntake,
  companyRequirementStatus,
  requirementAssignment,
} from "@/schema";

// The auto-audit middleware and the withdrawal record would otherwise reach
// for a real database.
mock.module("@/lib/audit", () => ({ logAudit: async () => {} }));

const { createCallerFactory } = await import("../init");
const { intakeRouter } = await import("./intake");
const { REOPEN_APPROVED_FIRST } = await import("../helpers/manual-status");
type TRPCContext = import("../init").TRPCContext;

const COMPANY = "company-1";
const USER = "11111111-1111-4111-8111-111111111111";
const ASSESSMENT = "22222222-2222-4222-8222-222222222222";
const CATEGORY = "33333333-3333-4333-8333-333333333333";

type Role = "admin" | "member" | "reviewer" | "legal_reviewer";

/** The requirement codes in the given category, with their intake field keys. */
function requirementsIn(categoryCode: string) {
  const matches = Object.entries(REQUIREMENT_FIELD_MAP)
    .filter(([, info]) => info.categoryCode === categoryCode)
    .map(([code, info]) => ({ code, fieldKeys: info.fieldKeys }));
  if (matches.length === 0) throw new Error(`no intake requirement in ${categoryCode}`);
  return matches;
}
const requirementIn = (categoryCode: string) => requirementsIn(categoryCode)[0];

const answering = (fieldKeys: readonly string[]) =>
  Object.fromEntries(fieldKeys.map((key) => [key, "answered"]));

const [GOV_REQUIREMENT, GOV_SIBLING] = requirementsIn("GOV");
/** Answers that fill every field of GOV_REQUIREMENT. */
const GOV_ANSWERS = answering(GOV_REQUIREMENT.fieldKeys);

type Write = { op: "insert" | "update" | "delete"; table: unknown; values?: unknown };

function setup(opts: {
  role: Role;
  ownsCategory: boolean;
  categoryCode: string | null;
  /** The status of the saved requirement's row. */
  rowStatus?: string;
  /** Answers already stored for the category. */
  storedAnswers?: Record<string, unknown>;
}) {
  const writes: Write[] = [];
  const requirementLookups: SQL[] = [];
  const statusRows = opts.rowStatus
    ? [
        {
          id: "status-1",
          requirementId: "requirement-1",
          status: opts.rowStatus,
          signedOffBy: USER,
          signedOffAt: new Date("2026-09-01"),
        },
      ]
    : [];

  // A select either reads the saved requirement's status rows under a lock,
  // reads who had signed, or becomes a subquery that is never awaited.
  const select = () => ({
    from: (table: unknown) => ({
      where: () =>
        table === companyRequirementStatus
          ? { orderBy: () => ({ for: async () => statusRows }) }
          : Promise.resolve([]),
    }),
  });

  const db = {
    query: {
      companyAssessment: {
        findFirst: async () => ({
          frameworkId: "framework-1",
          startedAt: new Date("2026-01-01"),
        }),
      },
      categoryAssignment: {
        findFirst: async () => (opts.ownsCategory ? { id: "assignment-1" } : undefined),
      },
      requirementCategory: {
        findFirst: async () =>
          opts.categoryCode === null ? undefined : { code: opts.categoryCode },
      },
      companyCategoryIntake: {
        findFirst: async () =>
          opts.storedAnswers
            ? { id: "intake-1", answers: opts.storedAnswers }
            : undefined,
      },
      requirement: {
        findMany: async ({ where }: { where: SQL }) => {
          requirementLookups.push(where);
          return [
            {
              id: "requirement-1",
              code: GOV_REQUIREMENT.code,
              categoryId: CATEGORY,
              frequency: "annual",
              priority: "P0",
            },
          ];
        },
      },
      // recalculateProgress, after a reopen.
      companyRequirementStatus: { findMany: async () => [] },
    },
    select,
    insert: (table: unknown) => ({
      values: async (values: unknown) => {
        writes.push({ op: "insert", table, values });
      },
    }),
    update: (table: unknown) => ({
      set: (values: unknown) => ({
        where: () => {
          writes.push({ op: "update", table, values });
          return Object.assign(Promise.resolve(), {
            returning: async () => [{ id: "status-1", status: "in_progress" }],
          });
        },
      }),
    }),
    delete: (table: unknown) => ({
      where: async () => {
        writes.push({ op: "delete", table });
      },
    }),
    transaction: async <T>(fn: (tx: unknown) => Promise<T>) => fn(db),
  };

  const caller = createCallerFactory(intakeRouter)({
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

  const saveGovRequirement = () =>
    caller.saveRequirementAnswers({
      assessmentId: ASSESSMENT,
      categoryId: CATEGORY,
      requirementCode: GOV_REQUIREMENT.code,
      answers: GOV_ANSWERS,
    });

  return { caller, writes, requirementLookups, saveGovRequirement };
}

/** A member who owns GOV. */
const GOV_OWNER = { role: "member", ownsCategory: true, categoryCode: "GOV" } as const;

const writesTo = (writes: Write[], table: unknown) =>
  writes.filter((w) => w.table === table);

describe("intake.save", () => {
  test.each(["reviewer", "legal_reviewer", "member"] as const)(
    "refuses a %s who does not own the category, before writing",
    async (role) => {
      const { caller, writes } = setup({ ...GOV_OWNER, role, ownsCategory: false });
      await expect(
        caller.save({ assessmentId: ASSESSMENT, categoryId: CATEGORY, answers: {} }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(writes).toEqual([]);
    },
  );

  test("lets the category owner save", async () => {
    const { caller, writes } = setup(GOV_OWNER);
    await caller.save({ assessmentId: ASSESSMENT, categoryId: CATEGORY, answers: {} });
    expect(writesTo(writes, companyCategoryIntake)).toHaveLength(1);
  });

  test("refuses a category outside the assessment's framework", async () => {
    const { caller, writes } = setup({ ...GOV_OWNER, role: "admin", categoryCode: null });
    await expect(
      caller.save({ assessmentId: ASSESSMENT, categoryId: CATEGORY, answers: {} }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(writes).toEqual([]);
  });

  // The category code the caller sends is ignored; the schema looked up is the
  // one for the code the database holds for the id.
  test("takes the category code from the database, not from the caller", async () => {
    const { caller } = setup({ ...GOV_OWNER, categoryCode: "NOPE" });
    const input = {
      assessmentId: ASSESSMENT,
      categoryId: CATEGORY,
      categoryCode: "GOV",
      answers: {},
    };
    await expect(caller.save(input)).rejects.toThrow(
      "No intake schema for category NOPE",
    );
  });
});

describe("intake.saveRequirementAnswers", () => {
  test("refuses a reviewer who does not own the category, before writing", async () => {
    const { saveGovRequirement, writes } = setup({
      ...GOV_OWNER,
      role: "reviewer",
      ownsCategory: false,
    });
    await expect(saveGovRequirement()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(writes).toEqual([]);
  });

  test("refuses a requirement from another category than the one owned", async () => {
    const { caller, writes } = setup(GOV_OWNER);
    await expect(
      caller.saveRequirementAnswers({
        assessmentId: ASSESSMENT,
        categoryId: CATEGORY,
        requirementCode: requirementIn("INC").code,
        answers: {},
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(writes).toEqual([]);
  });

  // Saving one requirement used to reopen every signed requirement in the
  // category with an answered field.
  test("moves only the requirement that was saved", async () => {
    const { saveGovRequirement, requirementLookups } = setup({
      ...GOV_OWNER,
      rowStatus: "not_started",
      storedAnswers: answering(GOV_SIBLING.fieldKeys),
    });
    await saveGovRequirement();
    expect(requirementLookups).toHaveLength(1);
    expect(new PgDialect().sqlToQuery(requirementLookups[0]).params).toEqual([
      GOV_REQUIREMENT.code,
    ]);
  });

  test("puts an unsigned requirement in progress without touching signatures", async () => {
    const { saveGovRequirement, writes } = setup({
      ...GOV_OWNER,
      rowStatus: "not_started",
    });
    await saveGovRequirement();
    expect(writesTo(writes, companyRequirementStatus)).toEqual([
      expect.objectContaining({
        values: expect.objectContaining({ status: "in_progress" }),
      }),
    ]);
    expect(writesTo(writes, requirementAssignment)).toEqual([]);
  });

  test("refuses to undo an approval for a member without review access", async () => {
    const { saveGovRequirement, writes } = setup({ ...GOV_OWNER, rowStatus: "approved" });
    await expect(saveGovRequirement()).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: REOPEN_APPROVED_FIRST,
    });
    expect(writes).toEqual([]);
  });

  test("lets an admin reopen an approved requirement by saving it", async () => {
    const { saveGovRequirement, writes } = setup({
      ...GOV_OWNER,
      role: "admin",
      rowStatus: "approved",
    });
    await saveGovRequirement();
    expect(writesTo(writes, companyRequirementStatus)).toEqual([
      expect.objectContaining({
        values: expect.objectContaining({ status: "in_progress", signedOffBy: null }),
      }),
    ]);
    expect(writesTo(writes, companyCategoryIntake)).toHaveLength(1);
  });

  // Clearing only the row's signature left each signer's own row signed, so
  // one new signature could close a multi-signer requirement on stale ones.
  test("reopening a completed requirement clears every signer's signature", async () => {
    const { saveGovRequirement, writes } = setup({
      ...GOV_OWNER,
      rowStatus: "completed",
    });
    await saveGovRequirement();
    expect(writesTo(writes, requirementAssignment)).toContainEqual(
      expect.objectContaining({
        op: "update",
        values: { signedOffAt: null, signedOffRole: null },
      }),
    );
    expect(writesTo(writes, companyRequirementStatus)).toEqual([
      expect.objectContaining({
        values: expect.objectContaining({
          status: "in_progress",
          signedOffBy: null,
          signOffSnapshot: null,
          completedAt: null,
        }),
      }),
    ]);
  });
});
