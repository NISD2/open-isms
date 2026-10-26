/**
 * The team router's invites: inviting an address again, sending an invite again, listing the open
 * ones, and accepting. Each test runs the procedure over a fake of just the drizzle calls it makes.
 */
import { describe, expect, mock, test } from "bun:test";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";

// The auto-audit middleware would otherwise reach for a real database.
mock.module("@/lib/audit", () => ({ logAudit: () => {} }));

const { createCallerFactory } = await import("../init");
const { teamRouter } = await import("./team");
const { managementHandoffPath } = await import("../helpers/invite-mail");
type TRPCContext = import("../init").TRPCContext;

const COMPANY = "company-1";
const OWNER = "11111111-1111-4111-8111-111111111111";
const SECOND = "22222222-2222-4222-8222-222222222222";
const MEMBER = "33333333-3333-4333-8333-333333333333";
const DAY_MS = 24 * 60 * 60 * 1000;
const INVITE_ID = "44444444-4444-4444-8444-444444444444";

const adminCaller = (db: unknown) =>
  createCallerFactory(teamRouter)({
    db: db as TRPCContext["db"],
    session: {
      role: "admin",
      accessLevel: "full",
      user: { name: "Olga Owner" },
    } as TRPCContext["session"],
    userId: OWNER,
    companyId: COMPANY,
    ip: "test",
    userAgent: null,
  } as TRPCContext);

type ExistingInvite = {
  token: string;
  status: string;
  expiresAt: Date;
  redirectPath?: string | null;
};

/**
 * `invite` to an address that already has a row in this company. The fake returns the token the
 * database would keep: the old one while the row is still the open invite that was read.
 */
async function reinvite(existing: ExistingInvite) {
  const stored: { values?: { token: string }; set?: { token: string | SQL } } = {};
  const db = {
    query: {
      user: { findFirst: async () => undefined },
      company: { findFirst: async () => ({ name: "Acme" }) },
      companyInvite: {
        findFirst: async () => ({ redirectPath: null, ...existing }),
      },
    },
    select: () => ({ from: () => ({ where: () => ({}) }) }),
    insert: () => ({
      values: (values: { token: string }) => {
        stored.values = values;
        return {
          onConflictDoUpdate: ({ set }: { set: { token: string | SQL } }) => {
            stored.set = set;
            const token = typeof set.token === "string" ? set.token : existing.token;
            return { returning: async () => [{ id: "invite-1", token }] };
          },
        };
      },
    }),
  };
  const result = await adminCaller(db).invite({ email: "anna@example.test" });
  return { stored, result };
}

describe("team.invite to an address invited before", () => {
  test("keeps the link of the invite still open, so the first mail keeps working", async () => {
    const { stored, result } = await reinvite({
      token: "first-mail",
      status: "pending",
      expiresAt: new Date(Date.now() + DAY_MS),
    });
    // Kept only if the row is still that open invite when the write runs; else the new link.
    const kept = stored.set?.token;
    expect(typeof kept).not.toBe("string");
    expect(new PgDialect().sqlToQuery(kept as SQL).params).toEqual([
      "first-mail",
      stored.values?.token,
    ]);
    expect(result.inviteUrl.endsWith("/invite/first-mail")).toBe(true);
  });

  test("issues a new link once the old one has expired", async () => {
    const { stored, result } = await reinvite({
      token: "first-mail",
      status: "pending",
      expiresAt: new Date(Date.now() - DAY_MS),
    });
    expect(stored.set?.token).toBe(stored.values?.token);
    expect(stored.set?.token).toHaveLength(64);
    expect(result.inviteUrl.endsWith("/invite/first-mail")).toBe(false);
  });

  test("issues a new link for an invite to somewhere else, so a mailed link keeps its meaning", async () => {
    // First a hand-off landing on the approval page, then a plain team invite.
    const { stored } = await reinvite({
      token: "first-mail",
      status: "pending",
      expiresAt: new Date(Date.now() + DAY_MS),
      redirectPath: "/de/preise/freigabe",
    });
    expect(stored.set?.token).toBe(stored.values?.token);
    expect(stored.set?.token).not.toBe("first-mail");
  });

  test("issues a new link after a withdrawal, so the withdrawn one stays dead", async () => {
    const { stored } = await reinvite({
      token: "first-mail",
      status: "revoked",
      expiresAt: new Date(Date.now() + DAY_MS),
    });
    expect(stored.set?.token).toBe(stored.values?.token);
    expect(stored.set?.token).not.toBe("first-mail");
  });
});

/** `resendInvite` over one stored invite, or none. */
async function resend(
  stored: (ExistingInvite & { email: string }) | undefined,
  options: {
    readonly joinedMeanwhile?: boolean;
    /** Where the invite lands; the approval page makes it a hand-off to management. */
    readonly redirectPath?: string | null;
    /** Who holds the company's account. */
    readonly holder?: string;
  } = {},
) {
  const { joinedMeanwhile = false, redirectPath = null, holder = OWNER } = options;
  const writes: { set: { token: string; expiresAt: Date }; params: unknown[] }[] = [];
  const db = {
    query: {
      user: { findFirst: async () => (joinedMeanwhile ? { id: MEMBER } : undefined) },
      company: { findFirst: async () => ({ name: "Acme" }) },
      companyInvite: {
        findFirst: async () =>
          stored && {
            ...stored,
            assignmentContext: { roleKeys: ["ceo"], categoryIds: [] },
            redirectPath,
          },
      },
    },
    select: () => ({
      from: () => ({
        // isMemberOf builds a subquery from this; nothing reads it.
        where: () => ({}),
        // holderOf: the account's owner.
        innerJoin: () => ({
          where: () => ({ limit: async () => [{ ownerUserId: holder }] }),
        }),
      }),
    }),
    update: () => ({
      set: (set: { token: string; expiresAt: Date }) => ({
        where: (where: SQL) => ({
          returning: async () => {
            writes.push({ set, params: new PgDialect().sqlToQuery(where).params });
            return [{ id: INVITE_ID }];
          },
        }),
      }),
    }),
  };
  const result = await adminCaller(db).resendInvite({ inviteId: INVITE_ID });
  return { result, writes };
}

describe("team.resendInvite", () => {
  test("an open invite keeps its link and gets seven more days", async () => {
    const before = Date.now();
    const { result, writes } = await resend({
      token: "first-mail",
      status: "pending",
      expiresAt: new Date(before + DAY_MS),
      email: "anna@example.test",
    });
    expect(result.inviteUrl.endsWith("/invite/first-mail")).toBe(true);
    expect(writes[0]?.set.token).toBe("first-mail");
    expect(writes[0]?.set.expiresAt.getTime()).toBeGreaterThanOrEqual(
      before + 7 * DAY_MS,
    );
  });

  test("an expired invite gets a new link", async () => {
    const { result, writes } = await resend({
      token: "first-mail",
      status: "pending",
      expiresAt: new Date(Date.now() - DAY_MS),
      email: "anna@example.test",
    });
    expect(writes[0]?.set.token).not.toBe("first-mail");
    expect(result.inviteUrl.endsWith(`/invite/${writes[0]?.set.token}`)).toBe(true);
  });

  test("writes only to an open invite of the caller's own company", async () => {
    const { writes } = await resend({
      token: "first-mail",
      status: "pending",
      expiresAt: new Date(Date.now() + DAY_MS),
      email: "anna@example.test",
    });
    // ...and only while the link is still the one read, so a re-invite in between wins.
    expect(writes[0]?.params).toEqual(
      expect.arrayContaining([INVITE_ID, COMPANY, "pending", "first-mail"]),
    );
  });

  test("refuses an invite that is not open in this company", async () => {
    await expect(resend(undefined)).rejects.toThrow("no longer open");
  });

  const open = {
    token: "first-mail",
    status: "pending",
    expiresAt: new Date(Date.now() + DAY_MS),
    email: "anna@example.test",
  };

  test("mails nobody who has joined the company meanwhile", async () => {
    await expect(resend(open, { joinedMeanwhile: true })).rejects.toThrow(
      "already a member",
    );
  });

  test("a hand-off to management is sent again only by the account holder", async () => {
    const handoff = { redirectPath: managementHandoffPath("de"), holder: SECOND };
    await expect(resend(open, handoff)).rejects.toThrow("Only the account holder");
    const { writes } = await resend(open, { ...handoff, holder: OWNER });
    expect(writes).toHaveLength(1);
  });
});

describe("team.listInvites", () => {
  test("says which links have expired and hands over nothing but what the page shows", async () => {
    const now = Date.now();
    const rows = [
      {
        id: "a",
        email: "open@example.test",
        token: "t-open",
        expiresAt: new Date(now + DAY_MS),
        assignmentContext: {
          roleKeys: ["cto"],
          categoryIds: ["55555555-5555-4555-8555-555555555555"],
        },
      },
      {
        id: "b",
        email: "late@example.test",
        token: "t-late",
        expiresAt: new Date(now - DAY_MS),
        assignmentContext: null,
      },
    ];
    let columns: unknown;
    const db = {
      query: {
        companyInvite: {
          findMany: async (opts: { columns: unknown }) => {
            columns = opts.columns;
            return rows;
          },
        },
      },
    };
    const listed = await adminCaller(db).listInvites();
    expect(listed.map((i) => [i.email, i.expired, i.role])).toEqual([
      ["open@example.test", false, "cto"],
      ["late@example.test", true, null],
    ]);
    expect(Object.keys(columns as object).sort()).toEqual(
      ["assignmentContext", "email", "expiresAt", "id", "token"].sort(),
    );
    expect(Object.keys(listed[0] ?? {}).sort()).toEqual(
      ["email", "expired", "expiresAt", "id", "inviteUrl", "role"].sort(),
    );
    expect(listed[0]?.inviteUrl.endsWith("/invite/t-open")).toBe(true);
  });
});

describe("team.acceptInvite", () => {
  test("joins nobody on an invite withdrawn after it was read", async () => {
    const inserted: unknown[] = [];
    const db = {
      query: {
        companyInvite: {
          findFirst: async () => ({
            id: INVITE_ID,
            companyId: "company-2",
            invitedBy: OWNER,
            email: "anna@example.test",
            role: "member",
            status: "pending",
            expiresAt: new Date(Date.now() + DAY_MS),
            assignmentContext: null,
          }),
        },
        companyMembership: { findFirst: async () => undefined },
      },
      // listUserCompanies: no other organization.
      select: () => ({
        from: () => ({
          innerJoin: () => ({ where: () => ({ orderBy: async () => [] }) }),
        }),
      }),
      transaction: async <T>(fn: (tx: unknown) => Promise<T>) =>
        fn({
          // The claim finds no open invite: it was withdrawn between the read and here.
          update: () => ({
            set: () => ({ where: () => ({ returning: async () => [] }) }),
          }),
          insert: (table: unknown) => {
            inserted.push(table);
            return { values: () => ({ onConflictDoUpdate: async () => undefined }) };
          },
        }),
    };
    const caller = createCallerFactory(teamRouter)({
      db: db as unknown as TRPCContext["db"],
      session: { user: { email: "anna@example.test" } } as TRPCContext["session"],
      userId: MEMBER,
      companyId: "draft-1",
      ip: "test",
      userAgent: null,
    } as TRPCContext);

    await expect(caller.acceptInvite({ token: "t" })).rejects.toThrow("already used");
    expect(inserted, "no membership was written").toEqual([]);
  });
});
