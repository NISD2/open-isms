/**
 * The Durchgang router writes a legal trail, so what it may touch is pinned here: only paying
 * accounts (or the platform admin) reach it, only the ten walk codes resolve, every lookup is
 * scoped to the session's company, the free-text note stays out of the audit JSON, and the asset
 * batch adds only names the company does not have yet.
 */
import { describe, expect, mock, test } from "bun:test";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import type { AuditEntry } from "@/lib/audit";
import { asset, companyPolicyConfig, companyRequirementStatus, policy } from "@/schema";

const audits: AuditEntry[] = [];
mock.module("@/lib/audit", () => ({
  logAudit: async (entry: AuditEntry) => {
    audits.push(entry);
  },
}));
// Sign-off rechecks run in the background against the real tables; they are pinned elsewhere.
mock.module("@/lib/compliance/module-recheck", () => ({
  invalidateModuleSignOffs: async () => {},
  recheckModuleRequirements: async () => {},
}));

const { createCallerFactory } = await import("../init");
const { durchgangRouter } = await import("./durchgang");
type TRPCContext = import("../init").TRPCContext;

const COMPANY = "44444444-4444-4444-8444-444444444444";
const USER = "11111111-1111-4111-8111-111111111111";
const ASSESSMENT = "22222222-2222-4222-8222-222222222222";
const REQUIREMENT = "55555555-5555-4555-8555-555555555555";
const STATUS = "66666666-6666-4666-8666-666666666666";
const CATEGORY = "77777777-7777-4777-8777-777777777777";

const dialect = new PgDialect();
const paramsOf = (where: SQL) => dialect.sqlToQuery(where).params;

type Write = { op: "insert" | "update"; table: unknown; values: unknown };

function setup(opts: {
  accessLevel: "full" | "grandfathered" | "free";
  statusRow?: boolean;
  existingAssets?: readonly string[];
  role?: "admin" | "member";
  assigned?: boolean;
  /** The walk's policy row of the item, if one was written before. */
  storedPolicy?: { id: string; content: string };
}) {
  const writes: Write[] = [];
  const wheres: Array<{ table: string; where: SQL }> = [];
  const captured =
    (table: string, result: unknown) =>
    async ({ where }: { where: SQL }) => {
      wheres.push({ table, where });
      return result;
    };

  const db = {
    query: {
      complianceFramework: { findFirst: async () => ({ id: "framework-1" }) },
      companyAssessment: { findFirst: captured("companyAssessment", { id: ASSESSMENT }) },
      requirement: {
        findFirst: captured("requirement", { id: REQUIREMENT, categoryId: CATEGORY }),
        findMany: async () => [{ id: REQUIREMENT, code: "12.2" }],
      },
      categoryAssignment: {
        findFirst: async () => (opts.assigned ? { id: "assignment-1" } : undefined),
      },
      companyRequirementStatus: {
        findFirst: captured(
          "companyRequirementStatus",
          opts.statusRow === false ? undefined : { id: STATUS },
        ),
        findMany: async () => [],
      },
      company: {
        findFirst: async () => ({
          activatedAt: new Date(),
          country: "DE",
          name: "Muster GmbH",
        }),
      },
      user: { findFirst: async () => ({ locale: "de" }) },
      asset: {
        findMany: captured(
          "asset",
          (opts.existingAssets ?? []).map((name) => ({ name })),
        ),
      },
    },
    update: (table: unknown) => ({
      set: (values: unknown) => ({
        where: () => {
          writes.push({ op: "update", table, values });
          const matched = opts.storedPolicy ? [{ id: opts.storedPolicy.id }] : [];
          return Object.assign(Promise.resolve(), { returning: async () => matched });
        },
      }),
    }),
    insert: (table: unknown) => ({
      values: (values: unknown) => {
        writes.push({ op: "insert", table, values });
        return Object.assign(Promise.resolve(), { onConflictDoUpdate: async () => {} });
      },
    }),
    selectDistinctOn: () => ({
      from: () => ({ where: () => ({ orderBy: async () => [] }) }),
    }),
    // The company lock and the lookup of the walk's policy row.
    select: () => ({
      from: (table: unknown) => {
        const rows =
          table === policy ? (opts.storedPolicy ? [opts.storedPolicy] : []) : [];
        return {
          where: () => Object.assign(Promise.resolve(rows), { for: async () => rows }),
        };
      },
    }),
    transaction: async <T>(work: (tx: unknown) => Promise<T>) => work(db),
  };

  const caller = createCallerFactory(durchgangRouter)({
    db: db as unknown as TRPCContext["db"],
    session: {
      role: opts.role ?? "admin",
      accessLevel: opts.accessLevel,
      user: { id: USER, email: "someone@example.com" },
    } as TRPCContext["session"],
    userId: USER,
    companyId: COMPANY,
    ip: "test",
    userAgent: null,
  } as TRPCContext);

  return { caller, writes, wheres };
}

describe("durchgang router", () => {
  test("is closed to accounts that have not bought the Durchgang", async () => {
    const { caller, writes } = setup({ accessLevel: "grandfathered" });
    await expect(caller.walk()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.wait({ code: "12.2", reason: "letter" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(caller.addAssets({ catalogIds: [] })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(writes).toEqual([]);
  });

  test("takes the category's owner or an admin, as the answers on the page do", async () => {
    audits.length = 0;
    const stranger = setup({ accessLevel: "full", role: "member", assigned: false });
    await expect(stranger.caller.finish({ code: "12.2" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(stranger.caller.adoptMethod()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(stranger.writes).toEqual([]);
    // The mutation middleware logs every attempt under the procedure's name; no state row follows.
    const states = () =>
      audits.map((a) => a.action).filter((a) => a.startsWith("durchgang."));
    expect(states()).toEqual([]);

    const owner = setup({ accessLevel: "full", role: "member", assigned: true });
    await owner.caller.finish({ code: "12.2" });
    expect(states()).toEqual(["durchgang.item_done"]);
  });

  test("resolves only the codes the walk contains", async () => {
    const { caller, writes } = setup({ accessLevel: "full" });
    await expect(caller.finish({ code: "7.3" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(writes).toEqual([]);
  });

  test("finds the item through the session's company and its own assessment", async () => {
    const { caller, wheres } = setup({ accessLevel: "full" });
    await caller.finish({ code: "12.2" });
    const assessment = wheres.find((w) => w.table === "companyAssessment");
    const status = wheres.find((w) => w.table === "companyRequirementStatus");
    expect(assessment && paramsOf(assessment.where)).toContain(COMPANY);
    expect(status && paramsOf(status.where)).toContain(ASSESSMENT);
  });

  test("writes nothing when the company has no status row for the item", async () => {
    const { caller, writes } = setup({ accessLevel: "full", statusRow: false });
    await expect(caller.wait({ code: "12.2", reason: "ask" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect(writes).toEqual([]);
  });

  test("waiting keeps the note in the trail and only the reason code in the audit row", async () => {
    audits.length = 0;
    const { caller, writes } = setup({ accessLevel: "full" });
    await caller.wait({
      code: "12.2",
      reason: "letter",
      note: "IT-Dienstleister fragen",
    });

    const note = writes.find(
      (w) => w.op === "update" && w.table === companyRequirementStatus,
    );
    expect(note).toBeDefined();
    const event = audits.find((a) => a.action === "durchgang.waiting");
    expect(event).toMatchObject({
      companyId: COMPANY,
      entityType: "requirement",
      entityId: REQUIREMENT,
      newValue: { reason: "letter" },
    });
    expect(JSON.stringify(event?.newValue)).not.toContain("IT-Dienstleister");
  });

  test("records a decision not to do an item with its reason in the trail, not in the audit row", async () => {
    audits.length = 0;
    const { caller, writes } = setup({ accessLevel: "full" });
    await expect(
      caller.decline({ code: "12.2", reason: "zu kurz" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(writes).toEqual([]);

    await caller.decline({
      code: "12.2",
      reason: "Wir sind bereits über den Konzern registriert.",
    });
    const note = writes.find(
      (w) => w.op === "update" && w.table === companyRequirementStatus,
    );
    expect(note).toBeDefined();
    const event = audits.find((a) => a.action === "durchgang.declined");
    expect(event).toMatchObject({ entityType: "requirement", entityId: REQUIREMENT });
    expect(JSON.stringify(event)).not.toContain("Konzern");
  });

  test("adds only catalogue items the company does not list yet, with their category as type", async () => {
    const { caller, writes, wheres } = setup({
      accessLevel: "full",
      existingAssets: ["vertrieb und kundenservice"],
    });
    const result = await caller.addAssets({
      catalogIds: ["bp-sales-cs", "bp-production-service", "no-such-item"],
    });
    expect(result).toEqual({ added: 1 });
    const insert = writes.find((w) => w.op === "insert" && w.table === asset);
    expect(insert?.values).toEqual([
      expect.objectContaining({ companyId: COMPANY, type: expect.any(String) }),
    ]);
    const lookup = wheres.find((w) => w.table === "asset");
    expect(lookup && paramsOf(lookup.where)).toContain(COMPANY);
  });

  test("names assets in the seed language and knows an item under either name", async () => {
    const { caller, writes } = setup({
      accessLevel: "full",
      existingAssets: ["Sales and customer service"],
    });
    const result = await caller.addAssets({
      catalogIds: ["bp-sales-cs", "bp-production-service"],
    });
    expect(result).toEqual({ added: 1 });
    const insert = writes.find((w) => w.op === "insert" && w.table === asset);
    expect(insert?.values).toEqual([
      expect.objectContaining({ name: "Produktion oder Dienstleistungserbringung" }),
    ]);
  });

  test("keeps the person's own entries, once each, as type other", async () => {
    const { caller, writes } = setup({ accessLevel: "full", existingAssets: ["Kasse"] });
    const result = await caller.addAssets({
      catalogIds: [],
      custom: [{ name: "Laborsoftware" }, { name: " laborsoftware " }, { name: "kasse" }],
    });
    expect(result).toEqual({ added: 1 });
    const insert = writes.find((w) => w.op === "insert" && w.table === asset);
    expect(insert?.values).toEqual([
      { companyId: COMPANY, name: "Laborsoftware", type: "other" },
    ]);
  });
});

/** The text a policy write stored, or nothing. */
const contentOf = (write: Write | undefined): string => {
  const values = write?.values;
  return typeof values === "object" &&
    values !== null &&
    "content" in values &&
    typeof values.content === "string"
    ? values.content
    : "";
};

describe("the walk's policy", () => {
  test("writes the Leitlinie in the seed language with the company's name and only known clauses", async () => {
    const { caller, writes } = setup({ accessLevel: "full" });
    await caller.writePolicy({ code: "2.4", clauses: ["training", "made-up"] });
    const config = writes.find((w) => w.table === companyPolicyConfig);
    expect(config?.values).toMatchObject({
      companyId: COMPANY,
      policyType: "information_security",
      config: { clauses: ["training"] },
    });
    const row = writes.find((w) => w.op === "insert" && w.table === policy);
    expect(row?.values).toMatchObject({
      companyId: COMPANY,
      requirementId: REQUIREMENT,
      title: "Leitlinie zur Informationssicherheit der Muster GmbH",
      type: "information_security",
    });
    const content = contentOf(row);
    expect(content).toContain("## 8. Schulung und Sensibilisierung");
    expect(content).not.toContain("{company}");
  });

  test("writes the base text when no clause is added, and keeps the stored choice untouched", async () => {
    const { caller, writes } = setup({ accessLevel: "full" });
    await caller.writePolicy({ code: "2.4", clauses: null });
    expect(writes.find((w) => w.table === companyPolicyConfig)).toBeUndefined();
    const content = contentOf(
      writes.find((w) => w.op === "insert" && w.table === policy),
    );
    expect(content).toContain("## 7. Bekanntgabe und Inkrafttreten");
    expect(content).not.toContain("## 8.");
  });

  test("shows the screen the document in the record language, with the company's name", async () => {
    const { caller } = setup({ accessLevel: "full" });
    const draft = await caller.policyDraft({ code: "2.4" });
    expect(draft.company).toBe("Muster GmbH");
    expect(draft.document.title).toBe(
      "Leitlinie zur Informationssicherheit der {company}",
    );
    expect(draft.clauses).toEqual([]);
  });

  test("puts a changed text back to draft, and leaves an unchanged one alone", async () => {
    const changed = setup({
      accessLevel: "full",
      storedPolicy: { id: "policy-1", content: "an older text" },
    });
    await changed.caller.writePolicy({ code: "2.4", clauses: [] });
    expect(
      changed.writes.find((w) => w.op === "update" && w.table === policy)?.values,
    ).toMatchObject({ status: "draft", effectiveFrom: null });

    const first = setup({ accessLevel: "full" });
    await first.caller.writePolicy({ code: "2.4", clauses: [] });
    const written = first.writes.find((w) => w.op === "insert" && w.table === policy);
    const same = setup({
      accessLevel: "full",
      storedPolicy: { id: "policy-1", content: contentOf(written) },
    });
    await same.caller.writePolicy({ code: "2.4", clauses: [] });
    expect(same.writes.filter((w) => w.table === policy)).toEqual([]);
  });

  test("approves with the signed version and day, and never writes the sign-off columns", async () => {
    const { caller, writes } = setup({
      accessLevel: "full",
      storedPolicy: { id: "policy-1", content: "text" },
    });
    const result = await caller.approvePolicy({
      code: "2.4",
      version: "1.0",
      approvedOn: "2026-10-01",
    });
    expect(result).toEqual({ approved: true });
    const update = writes.find((w) => w.op === "update" && w.table === policy);
    expect(update?.values).toMatchObject({
      status: "approved",
      version: "1.0",
      effectiveFrom: "2026-10-01",
    });
    expect(Object.keys(update?.values ?? {})).not.toContain("approvedBy");
    expect(Object.keys(update?.values ?? {})).not.toContain("approvedAt");
    expect(Object.keys(update?.values ?? {})).not.toContain("approverRole");
  });

  test("refuses an item without a policy screen, and accounts without the Durchgang", async () => {
    const { caller } = setup({ accessLevel: "full" });
    const refused = caller.writePolicy({ code: "12.2", clauses: [] });
    await expect(refused).rejects.toMatchObject({ code: "BAD_REQUEST" });
    const free = setup({ accessLevel: "free" });
    const closed = free.caller.writePolicy({ code: "2.4", clauses: [] });
    await expect(closed).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(free.writes).toEqual([]);
  });
});
