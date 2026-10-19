/**
 * send_supplier_questionnaire: to whom it sends, through what, and what it refuses. The caller
 * records every invite it is asked for; nothing here needs a database.
 */
import { describe, expect, mock, test } from "bun:test";
import { TRPCError } from "@trpc/server";

// The tool reaches lib/db and lib/auth, which read a validated env as they load; CI has none.
mock.module("@/lib/env", () => ({
  env: {
    DATABASE_URL: "postgres://unused:unused@localhost:5432/unused",
    AUTH_SECRET: "test-secret-test-secret-test-secret",
    NEXT_PUBLIC_APP_URL: "https://example.test",
  },
  mailSupportEmail: () => "support@example.test",
}));

const { sendQuestionnaire } = await import("./questionnaire");
type KeyHolder = import("./context").KeyHolder;

const HOSTER = "55555555-5555-4555-8555-555555555555";
const NO_EMAIL = "66666666-6666-4666-8666-666666666666";
const LINKED = "77777777-7777-4777-8777-777777777777";
const OPERATOR = "88888888-8888-4888-8888-888888888888";
const ASKED_TODAY = "99999999-9999-4999-8999-999999999999";
const UNLISTED = "12121212-1212-4212-8212-121212121212";
/** An address the app sent the questionnaire to less than a day ago. */
const RECENT = "it@recent.example";
/** The invite's magic-link token, which must never reach an assistant. */
const TOKEN = "a1".repeat(32);

/** One supplier of each kind the questionnaire meets, as supplier.list returns them. */
const SUPPLIERS = [
  { id: HOSTER, name: "Hoster GmbH", contactEmail: "it@hoster.example" },
  { id: NO_EMAIL, name: "Druckerei", contactEmail: null },
  {
    id: LINKED,
    name: "Cloud AG",
    contactEmail: "it@cloud.example",
    supplierCompanyId: "company-cloud",
  },
  {
    id: OPERATOR,
    name: "nisd2.eu",
    contactEmail: "hello@operator.example",
    source: "platform",
  },
  { id: ASKED_TODAY, name: "Wartung", contactEmail: RECENT },
].map((s) => ({ supplierCompanyId: null, source: null, ...s }));

/** A caller over 5.1, the item holding the supplier list, recording every call and invite. */
function holderOf(role = "admin", mayWalk = true) {
  const called: string[] = [];
  const invited: Array<{ readonly toEmail: string; readonly supplierId?: string }> = [];
  const record =
    <T>(name: string, value: T) =>
    async () => {
      called.push(name);
      return value;
    };
  const caller = {
    durchgang: {
      walk: record("durchgang.walk", [{ code: "5.1", state: { kind: "open" } }]),
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
    },
    supplier: { list: record("supplier.list", SUPPLIERS) },
    supplierInvite: {
      create: async (input: { toEmail: string; supplierId?: string }) => {
        called.push("supplierInvite.create");
        if (input.toEmail === RECENT) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message:
              "This supplier was already invited in the last 24 hours. You can send the invitation again after that.",
          });
        }
        invited.push(input);
        return {
          id: "invite-1",
          token: TOKEN,
          inviteUrl: `https://example.test/supplier-invite/${TOKEN}`,
          expiresAt: new Date("2026-11-18T00:00:00Z"),
        };
      },
    },
  };
  const holder = {
    caller,
    userId: "u1",
    companyId: "c1",
    role,
    mayWalk,
  } as unknown as KeyHolder;
  return { holder, called, invited };
}

/** Per supplier, its id and why it was refused, or null when it was sent. */
async function sent(holder: KeyHolder, suppliers: string[]) {
  const outcome = await sendQuestionnaire(holder, { suppliers, language: "en" });
  if (!outcome.ok) throw new Error(outcome.message);
  const rows = outcome.data.suppliers as ReadonlyArray<{
    readonly supplierId: string;
    readonly refused?: string;
  }>;
  return rows.map((r) => [r.supplierId, r.refused ?? null] as const);
}

/** The refusal's words, or a failure naming what was sent instead. */
async function refusalOf(holder: KeyHolder): Promise<string> {
  const outcome = await sendQuestionnaire(holder, {
    suppliers: [HOSTER],
    language: "en",
  });
  if (outcome.ok) throw new Error(`sent: ${JSON.stringify(outcome.data)}`);
  return outcome.message;
}

describe("send_supplier_questionnaire sends through the invite the app's button sends", () => {
  test("to the contact email on the supplier's row, for that row", async () => {
    const { holder, invited } = holderOf();
    expect(await sent(holder, [HOSTER])).toEqual([[HOSTER, null]]);
    expect(invited).toEqual([{ toEmail: "it@hoster.example", supplierId: HOSTER }]);
  });

  test("the invite link never reaches the assistant: whoever holds it answers as the supplier", async () => {
    const { holder } = holderOf();
    const text = JSON.stringify(
      await sendQuestionnaire(holder, { suppliers: [HOSTER], language: "en" }),
    );
    expect(text).not.toContain("supplier-invite/");
    expect(text).not.toContain(TOKEN);
  });

  test("no email, a linked supplier, the operator's own row and an unlisted id are each refused", async () => {
    const { holder, invited } = holderOf();
    const outcome = await sent(holder, [NO_EMAIL, LINKED, OPERATOR, UNLISTED, HOSTER]);
    expect(outcome.map(([id, refused]) => [id, refused !== null])).toEqual([
      [NO_EMAIL, true],
      [LINKED, true],
      [OPERATOR, true],
      [UNLISTED, true],
      [HOSTER, false],
    ]);
    expect(outcome[0]?.[1]).toContain("has no contact email");
    expect(invited.map((i) => i.supplierId)).toEqual([HOSTER]);
  });

  test("a supplier asked within the day keeps the app's reason, and the others are still sent", async () => {
    const { holder, invited } = holderOf();
    const outcome = await sent(holder, [ASKED_TODAY, HOSTER]);
    expect(outcome[0]?.[1]).toContain("last 24 hours");
    expect(invited.map((i) => i.supplierId)).toEqual([HOSTER]);
  });

  test("a supplier named twice is sent once", async () => {
    const { holder, invited } = holderOf();
    await sent(holder, [HOSTER, HOSTER]);
    expect(invited).toHaveLength(1);
  });

  test("a reviewer's assistant sends nothing", async () => {
    const { holder, called } = holderOf("legal_reviewer");
    expect(await refusalOf(holder)).toContain("sends nothing");
    expect(called).not.toContain("supplierInvite.create");
  });

  test("without the walkthrough in the plan, nothing is read or sent", async () => {
    const { holder, called } = holderOf("admin", false);
    expect(await refusalOf(holder)).toContain("not unlocked");
    expect(called).toEqual([]);
  });
});
