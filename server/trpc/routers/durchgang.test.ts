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
import {
  asset,
  companyPolicyConfig,
  companyRequirementStatus,
  policy,
  supplier,
} from "@/schema";

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

type Write = { op: "insert" | "update"; table: unknown; values: unknown; where?: SQL };

function setup(opts: {
  accessLevel: "full" | "grandfathered" | "free";
  statusRow?: boolean;
  existingAssets?: readonly string[];
  role?: "admin" | "member";
  assigned?: boolean;
  /** The walk's policy row of the item, if one was written before. */
  storedPolicy?: { id: string; content: string; title?: string };
  /** The category's saved intake answers. */
  answers?: Record<string, unknown>;
  /** The company's suppliers a lookup finds, with their two contract columns. */
  suppliers?: ReadonlyArray<{
    id: string;
    name: string;
    security: boolean | null;
    incidents: boolean | null;
  }>;
  /** The company's assets a lookup finds, with their second-factor and critical marks. */
  assets?: ReadonlyArray<{
    id: string;
    name: string;
    mfa?: boolean | null;
    isCritical?: boolean | null;
  }>;
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
      companyCategoryIntake: {
        findFirst: captured(
          "companyCategoryIntake",
          opts.answers ? { answers: opts.answers } : undefined,
        ),
      },
      asset: {
        findMany: captured(
          "asset",
          (opts.existingAssets ?? []).map((name) => ({ name })),
        ),
      },
    },
    update: (table: unknown) => ({
      set: (values: unknown) => ({
        where: (where?: SQL) => {
          writes.push({ op: "update", table, values, where });
          const matched = opts.storedPolicy
            ? [{ id: opts.storedPolicy.id, title: opts.storedPolicy.title ?? "" }]
            : [];
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
    // The company lock, the lookup of the walk's policy row, the company's suppliers and assets.
    select: () => ({
      from: (table: unknown) => {
        const rows =
          table === policy
            ? opts.storedPolicy
              ? [opts.storedPolicy]
              : []
            : table === supplier
              ? (opts.suppliers ?? [])
              : table === asset
                ? (opts.assets ?? [])
                : [];
        return {
          where: (where: SQL) => {
            if (table === supplier) wheres.push({ table: "supplier", where });
            if (table === asset) wheres.push({ table: "asset", where });
            return Object.assign(Promise.resolve(rows), { for: async () => rows });
          },
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
    // 7.1 is left out of the walk (NOT_WALKED), so it is not one of its codes.
    await expect(caller.finish({ code: "7.1" })).rejects.toMatchObject({
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

  test("writes the incident plan with the item's saved answers, and a line where one is open", async () => {
    const { caller, writes, wheres } = setup({
      accessLevel: "full",
      answers: {
        incidentLead: "Anna Weber",
        secureCommsChannel: "Threema Work",
        incidentEscalationContacts: "Geschäftsführung: Jonas Muster",
      },
    });
    await caller.writePolicy({ code: "3.1", clauses: ["card"] });
    const row = writes.find((w) => w.op === "insert" && w.table === policy);
    expect(row?.values).toMatchObject({
      title: "Notfallplan für IT-Sicherheitsvorfälle der Muster GmbH",
      type: "incident_response",
    });
    const content = contentOf(row);
    expect(content).toContain("Anna Weber leitet die Bewältigung");
    expect(content).toContain("erreichen wir uns über: Threema Work.");
    expect(content).toContain("IT-Notfallnummer _______________ an.");
    expect(content).toContain("mit unserer Nummer _______________.");
    expect(content).not.toContain("{");
    // The answers are read from this company's assessment and the item's category, nowhere else.
    const intake = wheres.find((w) => w.table === "companyCategoryIntake");
    expect(intake && paramsOf(intake.where)).toEqual([ASSESSMENT, CATEGORY]);
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

const DATEV = "88888888-8888-4888-8888-888888888881";
const TELEKOM = "88888888-8888-4888-8888-888888888882";

/** The text of the trail line an update appended, read from its SQL parameters. */
const noteOf = (writes: readonly Write[]): string => {
  const values = writes.find(
    (w) => w.op === "update" && w.table === companyRequirementStatus,
  )?.values;
  const notes =
    typeof values === "object" && values !== null && "internalNotes" in values
      ? values.internalNotes
      : undefined;
  return notes ? paramsOf(notes as SQL).join(" ") : "";
};

describe("the walk's supplier agreements", () => {
  const suppliers = [
    { id: DATEV, name: "DATEV", security: false, incidents: false },
    { id: TELEKOM, name: "Telekom", security: true, incidents: null },
  ];

  test("writes only the rows that changed, only the two columns, only on the company's rows", async () => {
    const { caller, writes, wheres } = setup({ accessLevel: "full", suppliers });
    const result = await caller.recordAgreements({
      code: "5.2",
      rows: [
        { supplierId: DATEV, security: true, incidents: true },
        { supplierId: TELEKOM, security: true, incidents: false },
      ],
    });
    expect(result).toEqual({ changed: 1 });
    const updates = writes.filter((w) => w.op === "update" && w.table === supplier);
    expect(updates).toHaveLength(1);
    expect(Object.keys(updates[0]?.values ?? {}).sort()).toEqual([
      "hasIncidentNotificationClause",
      "hasSecurityClauses",
      "updatedAt",
    ]);
    expect(updates[0]?.where && paramsOf(updates[0].where)).toEqual([DATEV, COMPANY]);
    const lookup = wheres.find((w) => w.table === "supplier");
    expect(lookup && paramsOf(lookup.where)).toContain(COMPANY);
  });

  test("names every supplier checked in the trail, a row with neither agreement included", async () => {
    const { caller, writes } = setup({ accessLevel: "full", suppliers });
    await caller.recordAgreements({
      code: "5.2",
      rows: [
        { supplierId: DATEV, security: true, incidents: true },
        { supplierId: TELEKOM, security: false, incidents: false },
      ],
    });
    const note = noteOf(writes);
    expect(note).toContain("DATEV: Sicherheit, Vorfallmeldung");
    expect(note).toContain("Telekom: nichts geregelt");
  });

  test("refuses a supplier of another company, and writes nothing", async () => {
    const { caller, writes } = setup({
      accessLevel: "full",
      suppliers: suppliers.slice(0, 1),
    });
    const refused = caller.recordAgreements({
      code: "5.2",
      rows: [
        { supplierId: DATEV, security: true, incidents: false },
        { supplierId: TELEKOM, security: true, incidents: false },
      ],
    });
    await expect(refused).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(writes.filter((w) => w.table === supplier)).toEqual([]);
  });

  test("refuses an item without an agreements screen, and accounts without the Durchgang", async () => {
    const { caller } = setup({ accessLevel: "full", suppliers });
    const row = { supplierId: DATEV, security: true, incidents: false };
    await expect(
      caller.recordAgreements({ code: "12.2", rows: [row] }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    const free = setup({ accessLevel: "free", suppliers });
    await expect(
      free.caller.recordAgreements({ code: "5.2", rows: [row] }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(free.writes).toEqual([]);
  });
});

describe("the walk's sign-ins", () => {
  const M365 = "99999999-9999-4999-8999-999999999991";
  const VPN = "99999999-9999-4999-8999-999999999992";
  const assets = [
    { id: M365, name: "Microsoft 365", mfa: false },
    { id: VPN, name: "VPN", mfa: null },
  ];

  test("writes only the rows that changed, only has_mfa, only on the company's assets", async () => {
    const { caller, writes, wheres } = setup({ accessLevel: "full", assets });
    const result = await caller.recordLogins({
      code: "11.1",
      rows: [
        { assetId: M365, mfa: true },
        { assetId: VPN, mfa: false },
      ],
    });
    expect(result).toEqual({ changed: 1 });
    const updates = writes.filter((w) => w.op === "update" && w.table === asset);
    expect(updates).toHaveLength(1);
    expect(Object.keys(updates[0]?.values ?? {}).sort()).toEqual(["hasMfa", "updatedAt"]);
    expect(updates[0]?.where && paramsOf(updates[0].where)).toEqual([M365, COMPANY]);
    const lookup = wheres.find((w) => w.table === "asset");
    expect(lookup && paramsOf(lookup.where)).toContain(COMPANY);
  });

  test("names every sign-in checked in the trail, a password-only row included", async () => {
    const { caller, writes } = setup({ accessLevel: "full", assets });
    await caller.recordLogins({
      code: "11.1",
      rows: [
        { assetId: M365, mfa: true },
        { assetId: VPN, mfa: false },
      ],
    });
    const note = noteOf(writes);
    expect(note).toContain("Microsoft 365: mit zweitem Faktor");
    expect(note).toContain("VPN: nur Passwort");
  });

  test("refuses an asset of another company, and writes nothing", async () => {
    const { caller, writes } = setup({ accessLevel: "full", assets: assets.slice(0, 1) });
    const refused = caller.recordLogins({
      code: "11.1",
      rows: [
        { assetId: M365, mfa: true },
        { assetId: VPN, mfa: true },
      ],
    });
    await expect(refused).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(writes.filter((w) => w.table === asset)).toEqual([]);
  });

  test("refuses an item without a sign-in screen, and accounts without the Durchgang", async () => {
    const { caller } = setup({ accessLevel: "full", assets });
    const row = { assetId: M365, mfa: true };
    await expect(
      caller.recordLogins({ code: "12.2", rows: [row] }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    const free = setup({ accessLevel: "free", assets });
    await expect(
      free.caller.recordLogins({ code: "11.1", rows: [row] }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(free.writes).toEqual([]);
  });
});

describe("the management's approval of the walk's documents", () => {
  const draft = {
    id: "88888888-8888-4888-8888-888888888899",
    content: "x",
    title: "Kryptokonzept der Muster GmbH",
  };
  const approve = { code: "7.3", approvedOn: "2026-10-01", types: ["cryptography"] };

  test("approves only drafts, only on the company's row of the item, from the day given", async () => {
    const { caller, writes } = setup({ accessLevel: "full", storedPolicy: draft });
    expect(await caller.approvePolicies(approve)).toEqual({ approved: 1 });
    const updates = writes.filter((w) => w.op === "update" && w.table === policy);
    expect(updates).toHaveLength(1);
    expect(updates[0]?.values).toMatchObject({
      status: "approved",
      effectiveFrom: "2026-10-01",
    });
    expect(Object.keys(updates[0]?.values ?? {}).sort()).toEqual([
      "effectiveFrom",
      "status",
      "updatedAt",
    ]);
    expect(updates[0]?.where && paramsOf(updates[0].where)).toEqual([
      COMPANY,
      REQUIREMENT,
      "cryptography",
      "draft",
    ]);
  });

  test("names every approved document in the review's trail, and writes none when nothing was a draft", async () => {
    const approved = setup({ accessLevel: "full", storedPolicy: draft });
    await approved.caller.approvePolicies(approve);
    expect(noteOf(approved.writes)).toContain(
      "Von der Geschäftsführung freigegeben am 2026-10-01: Kryptokonzept der Muster GmbH",
    );
    const nothing = setup({ accessLevel: "full" });
    expect(await nothing.caller.approvePolicies(approve)).toEqual({ approved: 0 });
    expect(noteOf(nothing.writes)).toBe("");
  });

  test("refuses a type the walk does not write, an item without the screen, and accounts without the Durchgang", async () => {
    const { caller, writes } = setup({ accessLevel: "full", storedPolicy: draft });
    await expect(
      caller.approvePolicies({ ...approve, types: ["crypto"] }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      caller.approvePolicies({ ...approve, code: "12.2" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(writes).toEqual([]);
    const free = setup({ accessLevel: "free", storedPolicy: draft });
    await expect(free.caller.approvePolicies(approve)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(free.writes).toEqual([]);
  });
});

describe("the processes that must keep running", () => {
  const SALES = "99999999-9999-4999-8999-999999999981";
  const BOOKS = "99999999-9999-4999-8999-999999999982";
  const assets = [
    { id: SALES, name: "Vertrieb", isCritical: false },
    { id: BOOKS, name: "Buchhaltung", isCritical: true },
  ];
  const rows = [
    { assetId: SALES, critical: true, how: "Aufträge per Telefon" },
    { assetId: BOOKS, critical: true, how: "" },
  ];

  test("writes is_critical only where it changed, only on the company's process assets", async () => {
    const { caller, writes, wheres } = setup({ accessLevel: "full", assets });
    expect(await caller.recordCritical({ code: "4.2", rows })).toEqual({ changed: 1 });
    const updates = writes.filter((w) => w.op === "update" && w.table === asset);
    expect(updates).toHaveLength(1);
    expect(Object.keys(updates[0]?.values ?? {}).sort()).toEqual([
      "isCritical",
      "updatedAt",
    ]);
    expect(updates[0]?.where && paramsOf(updates[0].where)).toEqual([SALES, COMPANY]);
    const lookup = wheres.find((w) => w.table === "asset");
    expect(lookup && paramsOf(lookup.where)).toEqual(
      expect.arrayContaining([COMPANY, "process"]),
    );
  });

  test("keeps each line with the plan's choices, and names the processes in the trail", async () => {
    const { caller, writes } = setup({ accessLevel: "full", assets });
    await caller.recordCritical({ code: "4.2", rows });
    const config = writes.find((w) => w.table === companyPolicyConfig);
    expect(config?.values).toMatchObject({
      policyType: "business_continuity",
      config: { clauses: [], fallbacks: { [SALES]: "Aufträge per Telefon" } },
    });
    expect(noteOf(writes)).toContain("Muss ohne IT weiterlaufen: Vertrieb, Buchhaltung");
  });

  test("refuses an asset that is not one of the company's processes, an item without the screen, and accounts without the Durchgang", async () => {
    const one = setup({ accessLevel: "full", assets: assets.slice(0, 1) });
    await expect(one.caller.recordCritical({ code: "4.2", rows })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect(one.writes.filter((w) => w.table === asset)).toEqual([]);
    await expect(one.caller.recordCritical({ code: "12.2", rows })).rejects.toMatchObject(
      { code: "BAD_REQUEST" },
    );
    const free = setup({ accessLevel: "free", assets });
    await expect(free.caller.recordCritical({ code: "4.2", rows })).rejects.toMatchObject(
      {
        code: "FORBIDDEN",
      },
    );
    expect(free.writes).toEqual([]);
  });
});
