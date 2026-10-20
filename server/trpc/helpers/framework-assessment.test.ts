/**
 * A company's assessment of a walk's framework, made ready when it opens the walk. Pinned here: a
 * missing assessment is created with a status row per requirement, an existing one gains only the
 * rows it lacks, a complete one is left alone, and the company row is locked first so two tabs
 * create one assessment.
 */
import { describe, expect, mock, test } from "bun:test";
import {
  company,
  companyAssessment,
  companyRequirementStatus,
  complianceFramework,
  requirement,
} from "@/schema";

const recalculated: string[] = [];
mock.module("./assessment-helpers", () => ({
  recalculateProgress: async (_db: unknown, id: string) => {
    recalculated.push(id);
  },
}));

const { ensureAssessment } = await import("./framework-assessment");

const COMPANY = "44444444-4444-4444-8444-444444444444";

interface World {
  readonly assessment: { id: string } | null;
  readonly requirements: readonly string[];
  readonly held: readonly string[];
}

function setup(world: World) {
  const inserts: Array<{ table: unknown; values: unknown }> = [];
  const updates: unknown[] = [];
  const locked: unknown[] = [];
  recalculated.length = 0;
  const rowsOf = (table: unknown): readonly unknown[] => {
    if (table === company) return [{ entityType: "important" }];
    if (table === complianceFramework) return [{ id: "fw-gdpr" }];
    if (table === requirement) return world.requirements.map((id) => ({ id }));
    if (table === companyRequirementStatus) return world.held.map((id) => ({ id }));
    return [];
  };
  const select = () => ({
    from: (table: unknown) => {
      const chain = Object.assign(Promise.resolve(rowsOf(table)), {
        where: () => chain,
        innerJoin: () => chain,
        for: () => {
          locked.push(table);
          return chain;
        },
      });
      return chain;
    },
  });
  const tx = {
    select,
    insert: (table: unknown) => ({
      values: (values: unknown) => {
        inserts.push({ table, values });
        return Object.assign(Promise.resolve(), {
          returning: async () => [{ id: "new-assessment" }],
          onConflictDoNothing: async () => {},
        });
      },
    }),
    update: (table: unknown) => ({
      set: () => ({
        where: async () => {
          updates.push(table);
        },
      }),
    }),
    query: {
      complianceFramework: { findFirst: async () => ({ id: "fw-gdpr" }) },
      companyAssessment: { findFirst: async () => world.assessment ?? undefined },
    },
  };
  const db = {
    ...tx,
    transaction: async <T>(work: (t: typeof tx) => Promise<T>) => work(tx),
  };
  return { db, inserts, updates, locked };
}

describe("making a company's assessment of a framework ready", () => {
  test("creates a missing assessment with a status row per requirement", async () => {
    const { db, inserts, locked } = setup({
      assessment: null,
      requirements: ["r1", "r2"],
      held: [],
    });
    const id = await ensureAssessment(db as never, COMPANY, "gdpr");
    expect(id).toBe("new-assessment");
    expect(locked).toEqual([company]);
    expect(inserts.map((i) => i.table)).toEqual([
      companyAssessment,
      companyRequirementStatus,
    ]);
    expect(inserts[1]?.values).toEqual([
      { assessmentId: "new-assessment", requirementId: "r1" },
      { assessmentId: "new-assessment", requirementId: "r2" },
    ]);
    expect(recalculated).toEqual(["new-assessment"]);
  });

  test("adds only the rows an existing assessment lacks, such as a requirement added later", async () => {
    const { db, inserts } = setup({
      assessment: { id: "a-1" },
      requirements: ["r1", "r2", "r3"],
      held: ["r1", "r2"],
    });
    expect(await ensureAssessment(db as never, COMPANY, "gdpr")).toBe("a-1");
    expect(inserts).toEqual([
      {
        table: companyRequirementStatus,
        values: [{ assessmentId: "a-1", requirementId: "r3" }],
      },
    ]);
  });

  test("leaves a complete assessment alone", async () => {
    const { db, inserts, updates } = setup({
      assessment: { id: "a-1" },
      requirements: ["r1"],
      held: ["r1"],
    });
    await ensureAssessment(db as never, COMPANY, "gdpr");
    expect(inserts).toEqual([]);
    expect(updates).toEqual([]);
    expect(recalculated).toEqual([]);
  });
});
