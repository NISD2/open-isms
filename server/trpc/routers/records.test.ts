/**
 * Who reaches the company's records through records.readPart (assistantExportProcedure): only an
 * assistant's key, only for someone who may export, only on a paid account, and inside an order's
 * money back not before the person has confirmed giving it up. Every refusal comes before any
 * record is read.
 *
 * There is no database here. Record reads go to a fake that counts them; the billing state's reads
 * are answered in the order the billing code asks them, whatever their shape.
 */
import { describe, expect, mock, test } from "bun:test";
import { TRPCError } from "@trpc/server";

// The router reaches lib/db and lib/auth, which read a validated env as they load; CI has none.
// The same values as every other test that mocks it, since a mock holds for the whole run.
mock.module("@/lib/env", () => ({
  env: {
    DATABASE_URL: "postgres://unused:unused@localhost:5432/unused",
    AUTH_SECRET: "test-secret-test-secret-test-secret",
    NEXT_PUBLIC_APP_URL: "https://example.test",
  },
  mailSupportEmail: () => "support@example.test",
}));
const { createCallerFactory } = await import("../init");
// The whole app's router, so the key's list (lib/mcp/procedures.ts) sees the real path,
// records.readPart, as it does in production.
const { appRouter } = await import("../router");
type TRPCContext = import("../init").TRPCContext;

const COMPANY = "33333333-3333-4333-8333-333333333333";
const USER = "44444444-4444-4444-8444-444444444444";

/**
 * A chain any query builder call returns, settling to the next queued answer when awaited, and
 * how many answers no read asked for. The answers stand for the billing code's reads in their
 * order; a test that queues them checks every one was asked, so if that code ever reads in another
 * order or another number, the test fails rather than quietly testing something else.
 */
function sequenced(answers: readonly unknown[][]) {
  const queue = [...answers];
  const chain = (): unknown =>
    new Proxy(() => {}, {
      get: (_target, prop) =>
        prop === "then"
          ? (resolve: (rows: unknown) => void) => resolve(queue.shift() ?? [])
          : () => chain(),
      apply: () => chain(),
    });
  return { select: () => chain(), unasked: () => queue.length };
}

const day = (offsetDays: number) =>
  new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);

/** The billing reads of an account inside the money back of an order placed two days ago. */
const INSIDE_MONEY_BACK: readonly unknown[][] = [
  [{ id: "account-1" }], // the company's billing account
  [{ id: "invoice-1", number: "2026-001", issueDate: day(-2), periodEnd: day(360) }], // its running order
  [{ id: "invoice-1" }], // the account's first invoice
  [{ replaces: null }], // the order replaces none
  [{ at: null }], // the money back is not given up
  [{ replaces: null }],
  [{ version: "2026-10-20" }], // under terms that tie the money back to the first export
];

/** The same order two days ago, with the money back given up on the export page. */
const MONEY_BACK_GIVEN_UP: readonly unknown[][] = [
  [{ id: "account-1" }],
  [{ id: "invoice-1", number: "2026-001", issueDate: day(-2), periodEnd: day(360) }],
  [{ id: "invoice-1" }],
  [{ replaces: null }],
  [{ at: new Date() }], // given up
];

/** No billing account: a full account with no running order reads as licensed. */
const LICENSED: readonly unknown[][] = [[]];

function harness({
  viaKey = true,
  role = "admin",
  jobTitle = null,
  accessLevel = "full",
  billing = LICENSED,
}: {
  viaKey?: boolean;
  role?: string;
  jobTitle?: string | null;
  accessLevel?: string;
  billing?: readonly unknown[][];
} = {}) {
  const reads: string[] = [];
  const billingReads = sequenced(billing);
  const query = new Proxy(
    {},
    {
      get: (_target, table: string) => ({
        findMany: async () => {
          reads.push(table);
          return [{ title: "Veraltetes Plugin" }];
        },
        findFirst: async () => {
          reads.push(table);
          return { name: "Beispielwerke GmbH" };
        },
      }),
    },
  );
  const caller = createCallerFactory(appRouter)({
    db: { query, select: billingReads.select } as unknown as TRPCContext["db"],
    session: {
      user: { id: USER },
      role,
      jobTitle,
      companyId: COMPANY,
      accessLevel,
    } as TRPCContext["session"],
    userId: USER,
    companyId: COMPANY,
    ip: "test",
    userAgent: "mcp: Claude",
    viaKey,
  }).records;
  return { caller, reads, unasked: billingReads.unasked };
}

const refusedWith = async (call: Promise<unknown>, code: TRPCError["code"]) => {
  const error = await call.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(TRPCError);
  expect(error instanceof TRPCError ? error.code : null).toBe(code);
};

describe("who reads the records", () => {
  test("an admin's assistant reads a page", async () => {
    const { caller, reads } = harness();
    expect(await caller.readPart({ part: "vulnerabilities" })).toEqual({
      kind: "rows",
      rows: [{ title: "Veraltetes Plugin" }],
      more: false,
    });
    expect(reads).toEqual(["vulnerability"]);
  });

  test("reviewers and management read too, as they may export", async () => {
    for (const who of [
      { role: "reviewer" },
      { role: "legal_reviewer" },
      { role: "member", jobTitle: "ceo" },
    ]) {
      const { caller } = harness(who);
      expect(await caller.readPart({ part: "company" })).toMatchObject({
        kind: "record",
      });
    }
  });

  test("a member who is not management reads nothing", async () => {
    for (const jobTitle of [null, "it_lead"]) {
      const { caller, reads } = harness({ role: "member", jobTitle });
      await refusedWith(caller.readPart({ part: "suppliers" }), "FORBIDDEN");
      expect(reads).toEqual([]);
    }
  });

  test("the person in the browser reads nothing here: the export page has the records", async () => {
    const { caller, reads } = harness({ viaKey: false });
    await refusedWith(caller.readPart({ part: "suppliers" }), "FORBIDDEN");
    expect(reads).toEqual([]);
  });

  test("a free account reads nothing", async () => {
    const { caller, reads } = harness({ accessLevel: "free" });
    await refusedWith(caller.readPart({ part: "suppliers" }), "FORBIDDEN");
    expect(reads).toEqual([]);
  });

  test("inside an order's money back, the read waits for the person's confirmation", async () => {
    const { caller, reads, unasked } = harness({ billing: INSIDE_MONEY_BACK });
    await refusedWith(caller.readPart({ part: "suppliers" }), "PRECONDITION_FAILED");
    expect(reads).toEqual([]);
    expect(unasked()).toBe(0);
  });

  test("once the person gave the money back up on the export page, the read goes through", async () => {
    const { caller, reads, unasked } = harness({ billing: MONEY_BACK_GIVEN_UP });
    expect(await caller.readPart({ part: "suppliers" })).toMatchObject({ kind: "rows" });
    expect(reads).toEqual(["supplier"]);
    expect(unasked()).toBe(0);
  });

  test("a key call under any path off the key's list is refused before any read", async () => {
    // Called on its own router, the procedure's path is "readPart", which the list does not hold:
    // the list (procedures.ts), not this procedure, is what refuses it.
    const { recordsRouter } = await import("./records");
    const { caller: inApp } = harness();
    const reads: string[] = [];
    const alone = createCallerFactory(recordsRouter)({
      db: {
        query: new Proxy(
          {},
          { get: (_t, table: string) => ({ findMany: async () => reads.push(table) }) },
        ),
        select: sequenced(LICENSED).select,
      } as unknown as TRPCContext["db"],
      session: {
        user: { id: USER },
        role: "admin",
        jobTitle: null,
        companyId: COMPANY,
        accessLevel: "full",
      } as TRPCContext["session"],
      userId: USER,
      companyId: COMPANY,
      ip: "test",
      userAgent: "mcp: Claude",
      viaKey: true,
    });
    const error = await alone.readPart({ part: "kpis" }).then(
      () => null,
      (e: unknown) => e,
    );
    expect(error instanceof TRPCError ? error.message : null).toBe(
      "Not available to an assistant.",
    );
    expect(reads).toEqual([]);
    // The same call under its real path passes the list.
    expect(await inApp.readPart({ part: "kpis" })).toMatchObject({ kind: "rows" });
  });

  test("a second page of a one-record part is refused before any read", async () => {
    const { caller, reads } = harness();
    await refusedWith(caller.readPart({ part: "company", page: 2 }), "BAD_REQUEST");
    expect(reads).toEqual([]);
  });
});
