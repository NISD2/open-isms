/**
 * The order fill_walkthrough_item keeps: every refusal comes before the first write, so a refused
 * call picks no waiting item up again and adds no row. The caller records each procedure it is
 * asked for; the refusals here are the ones that need no database.
 */
import { describe, expect, mock, test } from "bun:test";

const signedElsewhere: { codes: string[] } = { codes: [] };
mock.module("@/lib/audit", () => ({ logAudit: async () => {} }));
mock.module("@/lib/compliance/module-recheck", () => ({
  signedOffByModule: async () =>
    signedElsewhere.codes.map((code) => ({
      statusId: `status-${code}`,
      previousStatus: "approved",
      requirementCode: code,
    })),
  invalidateModuleSignOffs: async () => {},
  recheckModuleRequirements: async () => {},
}));

const { fillItem } = await import("./tools");
type KeyHolder = import("./context").KeyHolder;

const SINCE = new Date("2026-10-01T00:00:00Z");

/** A caller over one item of the walk, recording every procedure the tool calls. */
function holderOf(
  code: string,
  role: string,
  state: { readonly kind: string; readonly [detail: string]: unknown },
) {
  const called: string[] = [];
  const record =
    <T>(name: string, value: T) =>
    async () => {
      called.push(name);
      return value;
    };
  const caller = {
    durchgang: {
      walk: record("durchgang.walk", [{ code, state }]),
      resume: record("durchgang.resume", undefined),
    },
    requirement: {
      getByCode: record("requirement.getByCode", {
        id: "req-1",
        category: { id: "cat-1" },
        legalRef: null,
        frameworkRef: null,
      }),
    },
    assessment: {
      getActiveAssessment: record("assessment.getActiveAssessment", {
        id: "assessment-1",
      }),
      getStatusesByCategory: record("assessment.getStatusesByCategory", []),
    },
    intake: {
      saveRequirementAnswers: record("intake.saveRequirementAnswers", undefined),
      getRequirementAnswers: record("intake.getRequirementAnswers", { answers: {} }),
    },
    supplier: {
      list: record("supplier.list", []),
      create: record("supplier.create", { id: "row-1" }),
    },
    managementReview: {
      list: record("managementReview.list", []),
      create: record("managementReview.create", { id: "row-1" }),
    },
  };
  const holder = {
    caller,
    userId: "u1",
    companyId: "c1",
    role,
  } as unknown as KeyHolder;
  return { holder, called };
}

const WRITES = [
  "durchgang.resume",
  "intake.saveRequirementAnswers",
  "supplier.create",
  "managementReview.create",
];
const writesIn = (called: readonly string[]) => called.filter((c) => WRITES.includes(c));

const fill = (holder: KeyHolder, code: string, rows: Record<string, unknown>[]) =>
  fillItem(holder, { code, language: "en", rows });

/** The refusal's words, or a failure naming what was saved instead. */
async function refusalOf(outcome: ReturnType<typeof fill>): Promise<string> {
  const settled = await outcome;
  if (settled.ok) throw new Error(`saved: ${JSON.stringify(settled.data)}`);
  return settled.message;
}

describe("fill_walkthrough_item refuses before it writes", () => {
  test("rows that fail their check leave a waiting item waiting", async () => {
    const { holder, called } = holderOf("5.1", "admin", {
      kind: "waiting",
      reason: null,
      since: SINCE,
    });
    const rows = [{ name: "Hoster" }, { name: 12 }];
    expect(await refusalOf(fill(holder, "5.1", rows))).toContain("Row 1");
    expect(writesIn(called)).toEqual([]);
  });

  test("a reviewer's assistant reads the walk and fills nothing", async () => {
    const { holder, called } = holderOf("5.1", "legal_reviewer", { kind: "open" });
    expect(await refusalOf(fill(holder, "5.1", [{ name: "Hoster" }]))).toContain(
      "does not fill it in",
    );
    expect(writesIn(called)).toEqual([]);
  });

  test("a row that would take back another item's signature is added in the app", async () => {
    signedElsewhere.codes = ["5.2"];
    try {
      const { holder, called } = holderOf("5.1", "admin", { kind: "open" });
      expect(await refusalOf(fill(holder, "5.1", [{ name: "Hoster" }]))).toContain(
        "signature back from 5.2",
      );
      expect(writesIn(called)).toEqual([]);
    } finally {
      signedElsewhere.codes = [];
    }
  });

  test("with nothing signed that relies on it, the row is added", async () => {
    const { holder, called } = holderOf("5.1", "admin", { kind: "open" });
    expect(await fill(holder, "5.1", [{ name: "Hoster" }])).toMatchObject({ ok: true });
    expect(writesIn(called)).toEqual(["supplier.create"]);
  });

  test("rows on the item where management approves are refused", async () => {
    const { holder, called } = holderOf("7.3", "admin", { kind: "open" });
    expect(await refusalOf(fill(holder, "7.3", [{ title: "Review" }]))).toContain(
      "where management approves",
    );
    expect(writesIn(called)).toEqual([]);
  });
});
