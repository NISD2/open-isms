/**
 * The order fill_walkthrough_item keeps: every refusal comes before the first write, so a refused
 * call picks no waiting item up again and adds no row. The caller records each procedure it is
 * asked for; the refusals here are the ones that need no database.
 */
import { describe, expect, mock, test } from "bun:test";

/** Signed items the register's sign-off check finds; `openFor` checks pass first, unsigned. */
const signedElsewhere: { codes: string[]; openFor: number } = { codes: [], openFor: 0 };
// The tools reach lib/db and lib/auth, which read a validated env as they load; CI has none.
mock.module("@/lib/env", () => ({
  env: {
    DATABASE_URL: "postgres://unused:unused@localhost:5432/unused",
    AUTH_SECRET: "test-secret-test-secret-test-secret",
    NEXT_PUBLIC_APP_URL: "https://example.test",
  },
  mailSupportEmail: () => "support@example.test",
}));
/** The audit rows the tools write themselves (the procedures' own are the mocked caller's). */
const audited: Array<{ action: string; newValue?: unknown }> = [];
mock.module("@/lib/audit", () => ({
  logAudit: async (entry: { action: string; newValue?: unknown }) => {
    audited.push(entry);
  },
}));
mock.module("@/lib/compliance/module-recheck", () => ({
  signedOffByModule: async () => {
    if (signedElsewhere.openFor > 0) {
      signedElsewhere.openFor -= 1;
      return [];
    }
    return signedElsewhere.codes.map((code) => ({
      statusId: `status-${code}`,
      previousStatus: "approved",
      requirementCode: code,
    }));
  },
  invalidateModuleSignOffs: async () => {},
  recheckModuleRequirements: async () => {},
}));

const { fillItem, uploadFile } = await import("./tools");
const { getDefaultPolicyConfig } = await import(
  "@/lib/compliance/policy-config-defaults"
);
type KeyHolder = import("./context").KeyHolder;

const SINCE = new Date("2026-10-01T00:00:00Z");

/** A caller over one item of the walk, recording every procedure the tool calls. */
function holderOf(
  code: string,
  role: string,
  state: { readonly kind: string; readonly [detail: string]: unknown },
  policies: ReadonlyArray<{ readonly code: string; readonly status: string }> = [],
  suppliers: ReadonlyArray<{ readonly id: string }> = [],
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
      adoptCrypto: record("durchgang.adoptCrypto", { adopted: true }),
    },
    policyConfig: {
      update: record("policyConfig.update", { id: "config-1" }),
    },
    // The storage keys below are object paths, not credentials; `gitleaks:allow` marks them so.
    evidence: {
      createUploadUrl: record("evidence.createUploadUrl", {
        uploadUrl: "https://storage.example.test/put",
        storageKey: "companies/c1/evidence/x", // gitleaks:allow
        evidenceId: "ev-1",
        contentType: "application/pdf",
      }),
      confirmUpload: record("evidence.confirmUpload", { id: "ev-1" }),
      listByRequirementStatus: record("evidence.listByRequirementStatus", [
        { id: "ev-1", status: "draft" },
        { id: "ev-done", status: "in_review" },
      ]),
    },
    training: {
      getCertificateUploadUrl: record("training.getCertificateUploadUrl", {
        uploadUrl: "https://storage.example.test/put",
        fileKey: "companies/c1/certificates/x", // gitleaks:allow
        contentType: "application/pdf",
      }),
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
      getStatusesByCategory: record("assessment.getStatusesByCategory", [
        {
          requirementId: "req-1",
          requirementCode: code,
          status: { id: "status-1", status: "in_progress", signedOffAt: null },
        },
      ]),
    },
    intake: {
      saveRequirementAnswers: record("intake.saveRequirementAnswers", undefined),
      getRequirementAnswers: record("intake.getRequirementAnswers", { answers: {} }),
    },
    supplier: {
      list: record(
        "supplier.list",
        suppliers.map((s) => ({ ...s, supplierCompanyId: null })),
      ),
      create: record("supplier.create", { id: "row-1" }),
      update: record("supplier.update", { id: "row-1" }),
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
    mayWalk: true,
  } as unknown as KeyHolder;
  return { holder, called };
}

const WRITES = [
  "durchgang.resume",
  "durchgang.addAssets",
  "durchgang.writePolicy",
  "durchgang.adoptCrypto",
  "policyConfig.update",
  "supplier.update",
  "evidence.createUploadUrl",
  "evidence.confirmUpload",
  "training.getCertificateUploadUrl",
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

describe("a plan without the walkthrough", () => {
  test("is refused in the assistant's language, with the way to unlock it, before any read", async () => {
    const { holder, called } = holderOf("5.1", "admin", { kind: "open" });
    const locked = { ...holder, mayWalk: false };
    const outcome = await fillItem(locked, {
      code: "5.1",
      language: "cs",
      rows: [{ name: "Hoster" }],
    });
    expect(outcome).toMatchObject({ ok: false });
    expect(outcome.ok ? "" : outcome.message).toContain("není součástí plánu");
    expect(outcome.ok ? "" : outcome.message).toContain("/cs/");
    expect(called).toEqual([]);
  });
});

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

  test("a signature given while the call runs stops the rows still to come", async () => {
    // Open for the check before the first write and for the first row; signed for the second.
    signedElsewhere.codes = ["5.2"];
    signedElsewhere.openFor = 2;
    try {
      const { holder, called } = holderOf("5.1", "admin", { kind: "open" });
      const outcome = await fill(holder, "5.1", [{ name: "Hoster" }, { name: "Mailer" }]);
      expect(outcome.ok ? outcome.data.rows : outcome.message).toEqual([
        { index: 0, id: "row-1" },
        {
          index: 1,
          refused: expect.stringContaining("signature back from 5.2"),
        },
      ]);
      expect(writesIn(called)).toEqual(["supplier.create"]);
    } finally {
      signedElsewhere.codes = [];
      signedElsewhere.openFor = 0;
    }
  });

  test("with nothing signed that relies on it, the row is added", async () => {
    const { holder, called } = holderOf("5.1", "admin", { kind: "open" });
    expect(await fill(holder, "5.1", [{ name: "Hoster" }])).toMatchObject({ ok: true });
    expect(writesIn(called)).toEqual(["supplier.create"]);
  });

  test("what a call saved is recorded on the item, so the walkthrough can mark it", async () => {
    audited.length = 0;
    const { holder } = holderOf("5.1", "admin", { kind: "open" });
    await fill(holder, "5.1", [{ name: "Hoster" }]);
    expect(audited).toEqual([
      expect.objectContaining({
        action: "mcp.item_filled",
        newValue: { code: "5.1", answers: [], screens: [], register: true, files: 0 },
      }),
    ]);
  });

  test("a call whose every write was refused records nothing", async () => {
    signedElsewhere.codes = ["5.2"];
    signedElsewhere.openFor = 1;
    audited.length = 0;
    try {
      const { holder } = holderOf("5.1", "admin", { kind: "open" });
      await fill(holder, "5.1", [{ name: "Hoster" }]);
      expect(audited).toEqual([]);
    } finally {
      signedElsewhere.codes = [];
      signedElsewhere.openFor = 0;
    }
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

  test("the crypto list set entry by entry is saved through the requirement page's editor", async () => {
    const { holder, called } = holderOf("9.1", "admin", { kind: "open" });
    const list = getDefaultPolicyConfig("crypto", "cs");
    const outcome = await fillScreens(holder, "9.1", { crypto: { list } });
    expect(outcome).toMatchObject({ ok: true });
    expect(writesIn(called)).toEqual(["durchgang.adoptCrypto", "policyConfig.update"]);
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

const LISTED = "11111111-1111-4111-8111-111111111111";

/** 5.1, open, with one supplier listed in its register. */
const withListedSupplier = () =>
  holderOf("5.1", "admin", { kind: "open" }, [], [{ id: LISTED }]);

describe("fill_walkthrough_item corrects rows already in a register", () => {
  test("a supplier listed in 5.1 is corrected through the supplier's own update", async () => {
    const { holder, called } = withListedSupplier();
    const outcome = await fillItem(holder, {
      code: "5.1",
      language: "en",
      changes: [{ id: LISTED, fields: { name: "Hoster GmbH" } }],
    });
    expect(outcome).toMatchObject({ ok: true });
    expect(writesIn(called)).toEqual(["supplier.update"]);
  });

  test("a row the register does not list is refused before anything is written", async () => {
    const { holder, called } = withListedSupplier();
    const outcome = fillItem(holder, {
      code: "5.1",
      language: "en",
      changes: [
        { id: "22222222-2222-4222-8222-222222222222", fields: { name: "Fremd" } },
      ],
    });
    expect(await refusalOf(outcome)).toContain("is not a row of this register");
    expect(writesIn(called)).toEqual([]);
  });

  test("a correction that would take back a signature is made in the app", async () => {
    signedElsewhere.codes = ["5.2"];
    try {
      const { holder, called } = withListedSupplier();
      const outcome = fillItem(holder, {
        code: "5.1",
        language: "en",
        changes: [{ id: LISTED, fields: { name: "Hoster GmbH" } }],
      });
      expect(await refusalOf(outcome)).toContain("signature back from 5.2");
      expect(writesIn(called)).toEqual([]);
    } finally {
      signedElsewhere.codes = [];
    }
  });
});

const PDF = { fileName: "Nachweis.pdf", contentType: "application/pdf", fileSize: 2048 };

describe("upload_file gives an upload address after the same checks as filling", () => {
  test("evidence for an item: an address for its own record, then attached with files", async () => {
    const { holder, called } = holderOf("8.2", "admin", { kind: "open" });
    const outcome = await uploadFile(holder, {
      code: "8.2",
      language: "en",
      purpose: "evidence",
      ...PDF,
    });
    expect(outcome).toMatchObject({ ok: true, data: { evidenceId: "ev-1" } });
    expect(writesIn(called)).toEqual(["evidence.createUploadUrl"]);
    const attached = await fillItem(holder, {
      code: "8.2",
      language: "en",
      files: [{ evidenceId: "ev-1" }],
    });
    expect(attached).toMatchObject({ ok: true });
    expect(writesIn(called)).toContain("evidence.confirmUpload");
  });

  test("only a draft this item started is attached; others are refused, nothing confirmed", async () => {
    const { holder, called } = holderOf("8.2", "admin", { kind: "open" });
    const outcome = await fillItem(holder, {
      code: "8.2",
      language: "en",
      files: [
        { evidenceId: "ev-done" },
        { evidenceId: "99999999-9999-4999-8999-999999999999" },
      ],
    });
    expect(outcome).toMatchObject({
      ok: true,
      data: {
        files: [
          { evidenceId: "ev-done", refused: expect.any(String) },
          {
            evidenceId: "99999999-9999-4999-8999-999999999999",
            refused: expect.any(String),
          },
        ],
      },
    });
    expect(writesIn(called)).not.toContain("evidence.confirmUpload");
  });

  test("the upload request carries the encryption header the signature asks for", async () => {
    const { holder } = holderOf("8.2", "admin", { kind: "open" });
    const outcome = await uploadFile(holder, {
      code: "8.2",
      language: "en",
      purpose: "evidence",
      ...PDF,
    });
    expect(outcome).toMatchObject({
      ok: true,
      data: { upload: { headers: { "x-amz-server-side-encryption": "AES256" } } },
    });
  });

  test("a training certificate only where the item keeps training records", async () => {
    const { holder, called } = holderOf("9.1", "admin", { kind: "open" });
    const outcome = uploadFile(holder, {
      code: "9.1",
      language: "en",
      purpose: "training_certificate",
      ...PDF,
    });
    expect(await refusalOf(outcome)).toContain("keeps no training records");
    expect(writesIn(called)).toEqual([]);
  });

  test("a reviewer's assistant uploads nothing", async () => {
    const { holder, called } = holderOf("8.2", "legal_reviewer", { kind: "open" });
    const outcome = uploadFile(holder, {
      code: "8.2",
      language: "en",
      purpose: "evidence",
      ...PDF,
    });
    expect(await refusalOf(outcome)).toContain("does not fill it in");
    expect(writesIn(called)).toEqual([]);
  });
});
