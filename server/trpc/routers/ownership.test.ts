/**
 * Who may hand a company over, and to whom. Only the owner starts it, only with a code from their
 * mailbox, only to a member of the same company; only the person it is addressed to accepts it,
 * and only while it is open. Each refusal is checked to have written nothing.
 */
import { beforeEach, describe, expect, mock, test } from "bun:test";
import { getTableName } from "drizzle-orm";

// The auto-audit middleware would otherwise reach for a real database.
mock.module("@/lib/audit", () => ({ logAudit: () => {} }));

const state = {
  otpValid: true,
  otpChecks: 0,
};

// Full module shapes: bun module mocks are process-wide, so other files keep the real exports.
const otp = await import("@/lib/auth/otp");
mock.module("@/lib/auth/otp", () => ({
  ...otp,
  requestOtp: async () => ({ code: "123456" }),
  verifyOtp: async () => {
    state.otpChecks += 1;
    return state.otpValid;
  },
}));
const rateLimitModule = await import("@/lib/rate-limit");
mock.module("@/lib/rate-limit", () => ({
  ...rateLimitModule,
  rateLimit: async () => true,
}));
const ownershipMail = await import("../helpers/ownership-mail");
mock.module("../helpers/ownership-mail", () => ({
  ...ownershipMail,
  mailOwnershipNotice: () => {},
}));

const { createCallerFactory } = await import("../init");
const { ownershipRouter } = await import("./ownership");
type TRPCContext = import("../init").TRPCContext;

const COMPANY = "44444444-4444-4444-8444-444444444444";
const OWNER = "11111111-1111-4111-8111-111111111111";
const MEMBER = "22222222-2222-4222-8222-222222222222";
const ADMIN = "33333333-3333-4333-8333-333333333333";
const STRANGER = "55555555-5555-4555-8555-555555555555";
const TRANSFER = "66666666-6666-4666-8666-666666666666";

const DAY = 24 * 60 * 60 * 1000;

type Write = { readonly op: "insert" | "update"; readonly values: unknown };

/**
 * Just the drizzle calls the router makes. `members` is who belongs to COMPANY; `selects` answers
 * each `db.select(...)` chain in the order the procedure runs them; `locks` records the table of
 * each `for update` read, in order.
 */
function fakeDb(input: {
  ownerId: string;
  members: readonly string[];
  selects: unknown[][];
  writes: Write[];
  locks: string[];
}) {
  const chain = (result: unknown) => {
    const link: Record<string, unknown> = {};
    const read = { table: "" };
    for (const method of ["leftJoin", "where", "orderBy", "limit"]) {
      link[method] = () => link;
    }
    link.from = (table: Parameters<typeof getTableName>[0]) => {
      read.table = getTableName(table);
      return link;
    };
    link.for = () => {
      input.locks.push(read.table);
      return link;
    };
    // biome-ignore lint/suspicious/noThenProperty: a drizzle query is awaited as a thenable; the fake has to be one too.
    link.then = (
      resolve: (value: unknown) => unknown,
      reject?: (err: unknown) => unknown,
    ) => Promise.resolve(result).then(resolve, reject);
    return link;
  };
  // Who the membership lookup is about is in a condition we cannot read, so it is the next
  // person the test names.
  const db = {
    query: {
      company: { findFirst: async () => ({ ownerId: input.ownerId }) },
      user: { findFirst: async () => ({ email: "owner@muster.example" }) },
      companyMembership: {
        findFirst: async () => {
          const who = asked.shift();
          return who && input.members.includes(who) ? { role: "member" } : undefined;
        },
      },
    },
    select: () => chain(input.selects.shift() ?? []),
    insert: () => ({
      values: (values: unknown) => {
        input.writes.push({ op: "insert", values });
        const link = {
          onConflictDoNothing: () => link,
          returning: async () => [
            { id: TRANSFER, expiresAt: new Date(Date.now() + 7 * DAY) },
          ],
        };
        return link;
      },
    }),
    update: () => ({
      set: (values: unknown) => ({
        where: () => {
          input.writes.push({ op: "update", values });
          // Awaited as is, or asked whether a membership was updated (setMembershipRole).
          return Object.assign(Promise.resolve(), {
            returning: async () => [{ userId: MEMBER }],
          });
        },
      }),
    }),
    transaction: async <T>(fn: (tx: unknown) => Promise<T>) => fn(db),
  };
  return db;
}

const asked: string[] = [];

function callerAs(
  userId: string,
  opts: {
    role?: "admin" | "member";
    ownerId?: string;
    members?: readonly string[];
    selects?: unknown[][];
  } = {},
) {
  const writes: Write[] = [];
  const locks: string[] = [];
  const db = fakeDb({
    ownerId: opts.ownerId ?? OWNER,
    members: opts.members ?? [OWNER, MEMBER, ADMIN],
    selects: opts.selects ?? [],
    writes,
    locks,
  });
  const caller = createCallerFactory(ownershipRouter)({
    db: db as unknown as TRPCContext["db"],
    session: {
      role: opts.role ?? "admin",
      accessLevel: "full",
    } as TRPCContext["session"],
    userId,
    companyId: COMPANY,
    ip: "test",
    userAgent: null,
    viaKey: false,
  } as TRPCContext);
  return { caller, writes, locks };
}

/** What the company lock reads: the owner. */
const ownedBy = (ownerId: string) => [{ ownerId }];

const pendingRow = (overrides: Record<string, unknown> = {}) => ({
  id: TRANSFER,
  companyId: COMPANY,
  fromUserId: OWNER,
  toUserId: MEMBER,
  status: "pending",
  expiresAt: new Date(Date.now() + DAY),
  fromName: "Anna",
  toName: "Jan",
  ...overrides,
});

beforeEach(() => {
  state.otpValid = true;
  state.otpChecks = 0;
  asked.length = 0;
});

describe("ownership.start", () => {
  test("the owner, with the right code, asks to hand over to a member", async () => {
    asked.push(MEMBER);
    const { caller, writes, locks } = callerAs(OWNER, { selects: [[], ownedBy(OWNER)] });
    expect(await caller.start({ toUserId: MEMBER, otp: "123456" })).toEqual({
      transferId: TRANSFER,
    });
    expect(locks).toEqual(["company"]);
    const insert = writes.find((w) => w.op === "insert");
    expect(insert?.values).toMatchObject({
      companyId: COMPANY,
      fromUserId: OWNER,
      toUserId: MEMBER,
      method: "self_service",
      status: "pending",
    });
  });

  test("an admin who is not the owner cannot start one", async () => {
    asked.push(MEMBER);
    const { caller, writes } = callerAs(ADMIN);
    await expect(caller.start({ toUserId: MEMBER, otp: "123456" })).rejects.toThrow(
      "Only the owner",
    );
    expect(state.otpChecks).toBe(0);
    expect(writes).toEqual([]);
  });

  test("a member who is not an admin cannot start one", async () => {
    const { caller, writes } = callerAs(MEMBER, { role: "member", ownerId: MEMBER });
    await expect(caller.start({ toUserId: ADMIN, otp: "123456" })).rejects.toThrow();
    expect(writes).toEqual([]);
  });

  test("without the right code nothing is asked", async () => {
    state.otpValid = false;
    asked.push(MEMBER);
    const { caller, writes } = callerAs(OWNER, { selects: [[]] });
    await expect(caller.start({ toUserId: MEMBER, otp: "000000" })).rejects.toThrow(
      "code is wrong",
    );
    expect(writes).toEqual([]);
  });

  test("a person from another company is refused before the code is spent", async () => {
    asked.push(STRANGER);
    const { caller, writes } = callerAs(OWNER);
    await expect(caller.start({ toUserId: STRANGER, otp: "123456" })).rejects.toThrow(
      "not found in your company",
    );
    expect(state.otpChecks).toBe(0);
    expect(writes).toEqual([]);
  });

  // The middleware saw the owner, then an operator assigned a new one before the save. A request
  // saved now would hold the company's one open slot for someone who no longer owns it.
  test("nothing is saved when the company changed hands since the owner check", async () => {
    asked.push(MEMBER);
    const { caller, writes } = callerAs(OWNER, { selects: [[], ownedBy(ADMIN)] });
    await expect(caller.start({ toUserId: MEMBER, otp: "123456" })).rejects.toThrow(
      "Only the owner",
    );
    expect(writes).toEqual([]);
  });

  test("a second open handover is refused before the code is spent", async () => {
    asked.push(MEMBER);
    const { caller, writes } = callerAs(OWNER, { selects: [[pendingRow()]] });
    await expect(caller.start({ toUserId: MEMBER, otp: "123456" })).rejects.toThrow(
      "already open",
    );
    expect(state.otpChecks).toBe(0);
    expect(writes).toEqual([]);
  });
});

describe("ownership.accept", () => {
  test("the recipient takes over an open handover", async () => {
    asked.push(MEMBER, MEMBER);
    const { caller, writes, locks } = callerAs(MEMBER, {
      role: "member",
      selects: [ownedBy(OWNER), [pendingRow()]],
    });
    expect(await caller.accept({ transferId: TRANSFER })).toEqual({ accepted: true });
    // The company row first, as the operator's assignment locks it, so the two never deadlock.
    expect(locks).toEqual(["company", "ownership_transfer"]);
    expect(writes.map((w) => w.values)).toContainEqual(
      expect.objectContaining({ status: "accepted", decidedBy: MEMBER }),
    );
    expect(writes.map((w) => w.values)).toContainEqual(
      expect.objectContaining({ ownerId: MEMBER }),
    );
  });

  test("an expired handover cannot be accepted", async () => {
    asked.push(MEMBER);
    const { caller, writes } = callerAs(MEMBER, {
      role: "member",
      selects: [ownedBy(OWNER), [pendingRow({ expiresAt: new Date(Date.now() - 1) })]],
    });
    await expect(caller.accept({ transferId: TRANSFER })).rejects.toThrow(
      "no longer open",
    );
    expect(writes).toEqual([]);
  });

  test("a cancelled handover cannot be accepted", async () => {
    asked.push(MEMBER);
    const { caller, writes } = callerAs(MEMBER, {
      role: "member",
      selects: [ownedBy(OWNER), [pendingRow({ status: "cancelled" })]],
    });
    await expect(caller.accept({ transferId: TRANSFER })).rejects.toThrow(
      "no longer open",
    );
    expect(writes).toEqual([]);
  });

  test("someone else in the company cannot accept it for the recipient", async () => {
    asked.push(ADMIN);
    const { caller, writes } = callerAs(ADMIN, {
      selects: [ownedBy(OWNER), [pendingRow()]],
    });
    await expect(caller.accept({ transferId: TRANSFER })).rejects.toThrow(
      "addressed to someone else",
    );
    expect(writes).toEqual([]);
  });

  test("another company's handover is not found from this company", async () => {
    const { caller, writes } = callerAs(MEMBER, { role: "member", selects: [[]] });
    await expect(caller.accept({ transferId: TRANSFER })).rejects.toThrow("not found");
    expect(writes).toEqual([]);
  });
});

describe("ownership.cancel", () => {
  test("the recipient declines", async () => {
    const { caller, writes } = callerAs(MEMBER, {
      role: "member",
      selects: [[pendingRow()]],
    });
    expect(await caller.cancel({ transferId: TRANSFER })).toEqual({ cancelled: true });
    expect(writes[0]?.values).toMatchObject({ status: "cancelled", decidedBy: MEMBER });
  });

  test("a third member cannot call it off", async () => {
    const { caller, writes } = callerAs(ADMIN, { selects: [[pendingRow()]] });
    await expect(caller.cancel({ transferId: TRANSFER })).rejects.toThrow(
      "No open handover",
    );
    expect(writes).toEqual([]);
  });
});
