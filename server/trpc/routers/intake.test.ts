/**
 * Intake writes move requirements: a save reopens signed ones, a submit
 * approves them. So every write needs the category owner or an admin, and the
 * category the write is about is the one the database names for its id, never
 * a code the caller sends alongside it.
 */
import { describe, expect, mock, test } from "bun:test";
import { REQUIREMENT_FIELD_MAP } from "@/lib/compliance/requirement-fields";

// The auto-audit middleware would otherwise reach for a real database.
mock.module("@/lib/audit", () => ({ logAudit: async () => {} }));

const { createCallerFactory } = await import("../init");
const { intakeRouter } = await import("./intake");
type TRPCContext = import("../init").TRPCContext;

const COMPANY = "company-1";
const USER = "11111111-1111-4111-8111-111111111111";
const ASSESSMENT = "22222222-2222-4222-8222-222222222222";
const CATEGORY = "33333333-3333-4333-8333-333333333333";

type Role = "admin" | "member" | "reviewer" | "legal_reviewer";

/** A requirement code with intake fields in the given category. */
function requirementIn(categoryCode: string): string {
  const match = Object.entries(REQUIREMENT_FIELD_MAP).find(
    ([, info]) => info.categoryCode === categoryCode,
  );
  if (!match) throw new Error(`no intake requirement in ${categoryCode}`);
  return match[0];
}

function setup(opts: { role: Role; ownsCategory: boolean; categoryCode: string | null }) {
  const writes: unknown[] = [];
  const db = {
    query: {
      companyAssessment: { findFirst: async () => ({ frameworkId: "framework-1" }) },
      categoryAssignment: {
        findFirst: async () => (opts.ownsCategory ? { id: "assignment-1" } : undefined),
      },
      requirementCategory: {
        findFirst: async () =>
          opts.categoryCode === null ? undefined : { code: opts.categoryCode },
      },
      companyCategoryIntake: { findFirst: async () => undefined },
      // No requirement rows, so deriving statuses from the answers is a no-op.
      requirement: { findMany: async () => [] },
    },
    insert: () => ({
      values: async (values: unknown) => {
        writes.push(values);
      },
    }),
    update: () => ({
      set: (values: unknown) => ({
        where: async () => {
          writes.push(values);
        },
      }),
    }),
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
  return { caller, writes };
}

/** A member who owns GOV. */
const GOV_OWNER = { role: "member", ownsCategory: true, categoryCode: "GOV" } as const;

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
    expect(writes).toHaveLength(1);
  });

  test("refuses a category outside the assessment's framework", async () => {
    const { caller, writes } = setup({ ...GOV_OWNER, role: "admin", categoryCode: null });
    await expect(
      caller.save({ assessmentId: ASSESSMENT, categoryId: CATEGORY, answers: {} }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(writes).toEqual([]);
  });
});

describe("intake.saveRequirementAnswers", () => {
  test("refuses a reviewer who does not own the category, before writing", async () => {
    const { caller, writes } = setup({
      ...GOV_OWNER,
      role: "reviewer",
      ownsCategory: false,
    });
    await expect(
      caller.saveRequirementAnswers({
        assessmentId: ASSESSMENT,
        categoryId: CATEGORY,
        requirementCode: requirementIn("GOV"),
        answers: {},
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(writes).toEqual([]);
  });

  test("refuses a requirement from another category than the one owned", async () => {
    const { caller, writes } = setup(GOV_OWNER);
    await expect(
      caller.saveRequirementAnswers({
        assessmentId: ASSESSMENT,
        categoryId: CATEGORY,
        requirementCode: requirementIn("INC"),
        answers: {},
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(writes).toEqual([]);
  });

  test("lets the category owner save one of its requirements", async () => {
    const { caller, writes } = setup(GOV_OWNER);
    await caller.saveRequirementAnswers({
      assessmentId: ASSESSMENT,
      categoryId: CATEGORY,
      requirementCode: requirementIn("GOV"),
      answers: {},
    });
    expect(writes).toHaveLength(1);
  });
});

describe("intake.submit", () => {
  test("refuses a member who does not own the category", async () => {
    const { caller } = setup({ ...GOV_OWNER, ownsCategory: false });
    await expect(
      caller.submit({ assessmentId: ASSESSMENT, categoryId: CATEGORY }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  // The attack this closes: an owner of GOV sending GOV's id with "INC" to
  // get INC's requirements approved. The code sent is ignored; the schema
  // looked up is the one for the code the database holds for the id.
  test("takes the category code from the database, not from the caller", async () => {
    const { caller } = setup({ ...GOV_OWNER, categoryCode: "NOPE" });
    const input = { assessmentId: ASSESSMENT, categoryId: CATEGORY, categoryCode: "INC" };
    await expect(caller.submit(input)).rejects.toThrow(
      "No intake schema for category NOPE",
    );
  });
});
