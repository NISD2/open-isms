/**
 * The order fill_walkthrough_item keeps: every refusal comes before the first write, so a refused
 * call picks no waiting item up again and adds no row. The caller records each procedure it is
 * asked for; the refusals here are the ones that need no database.
 */
import { describe, expect, mock, test } from "bun:test";

const signedElsewhere: { codes: string[] } = { codes: [] };
// The tools reach lib/db and lib/auth, which read a validated env as they load; CI has none.
mock.module("@/lib/env", () => ({
  env: {
    DATABASE_URL: "postgres://unused:unused@localhost:5432/unused",
    AUTH_SECRET: "test-secret-test-secret-test-secret",
    NEXT_PUBLIC_APP_URL: "https://example.test",
  },
  mailSupportEmail: () => "support@example.test",
}));
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
  policies: ReadonlyArray<{ readonly code: string; readonly status: string }> = [],
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
      addAssets: record("durchgang.addAssets", { added: 1 }),
      writePolicy: record("durchgang.writePolicy", undefined),
      walkPolicies: record("durchgang.walkPolicies", policies),
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
  "durchgang.addAssets",
  "durchgang.writePolicy",
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

const fillScreens = (holder: KeyHolder, code: string, screens: Record<string, unknown>) =>
  fillItem(holder, { code, language: "en", screens });

describe("fill_walkthrough_item fills an item's other screens through their own saves", () => {
  test("assets on 2.2 go through the save the asset screen calls", async () => {
    const { holder, called } = holderOf("2.2", "admin", { kind: "open" });
    const outcome = await fillScreens(holder, "2.2", {
      assets: { catalogIds: [], custom: [{ name: "Buchhaltung", layer: "anwendung" }] },
    });
    expect(outcome).toMatchObject({ ok: true });
    expect(writesIn(called)).toEqual(["durchgang.addAssets"]);
  });

  test("an asset that would take back another item's signature is added in the app", async () => {
    signedElsewhere.codes = ["2.1"];
    try {
      const { holder, called } = holderOf("2.2", "admin", { kind: "open" });
      const outcome = fillScreens(holder, "2.2", { assets: { catalogIds: [] } });
      expect(await refusalOf(outcome)).toContain("signature back from 2.1");
      expect(writesIn(called)).toEqual([]);
    } finally {
      signedElsewhere.codes = [];
    }
  });

  test("a screen whose input fails its schema is refused before anything is written", async () => {
    const { holder, called } = holderOf("2.2", "admin", {
      kind: "waiting",
      reason: null,
      since: SINCE,
    });
    const outcome = fillScreens(holder, "2.2", { assets: { catalogIds: "all" } });
    expect(await refusalOf(outcome)).toContain("assets:");
    expect(writesIn(called)).toEqual([]);
  });

  test("a screen the item does not have, or the approval, is never filled", async () => {
    const { holder, called } = holderOf("2.2", "admin", { kind: "open" });
    expect(await refusalOf(fillScreens(holder, "2.2", { approve: {} }))).toContain(
      "has no screen an assistant fills",
    );
    expect(await refusalOf(fillScreens(holder, "2.2", { policy: {} }))).toContain(
      "has no screen an assistant fills",
    );
    expect(writesIn(called)).toEqual([]);
  });

  test("a policy management approved is rewritten in the app, not by an assistant", async () => {
    const { holder, called } = holderOf("3.1", "admin", { kind: "open" }, [
      { code: "3.1", status: "approved" },
    ]);
    const outcome = fillScreens(holder, "3.1", {
      policy: { clauses: null, own: "Mehr" },
    });
    expect(await refusalOf(outcome)).toContain("takes that approval back");
    expect(writesIn(called)).toEqual([]);
  });
});
