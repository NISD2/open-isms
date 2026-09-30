/**
 * The three supplier paths that mail an address the sender typed in: a
 * supplier adding a customer, a supplier publishing an incident notice, and a
 * customer inviting a supplier. Pinned here: each stops at its budget in
 * server/trpc/helpers/supplier-mail-budget.ts, the daily cap on new recipients
 * spans all of them, an invite is sent again only after its cooldown, and the
 * mails carry neither the sender's free text nor a link from its name.
 */
import { beforeEach, describe, expect, mock, test } from "bun:test";
import { randomUUID } from "node:crypto";

mock.module("@/lib/audit", () => ({ logAudit: async () => {} }));

// The limiter counts in Postgres, which this suite does not have. The stand-in
// keeps the same contract, a fixed window per key that opens on its first hit,
// on a clock the tests move, so an hourly budget can run out and reset while a
// daily one keeps counting. The real counting is drilled in
// scripts/ci/rate-limit-drill.ts.
const clock = { now: 0 };
const windows = new Map<string, { count: number; resetAt: number }>();
mock.module("@/lib/rate-limit", () => ({
  rateLimit: async (key: string, limit: number, windowMs: number) => {
    const window = windows.get(key);
    if (!window || window.resetAt <= clock.now) {
      windows.set(key, { count: 1, resetAt: clock.now + windowMs });
      return true;
    }
    if (window.count >= limit) return false;
    window.count += 1;
    return true;
  },
}));

type Mail = { to: string; subject: string; html: string; text: string };
const mails: Mail[] = [];
// Full export shape, as broadcast.test.ts mocks the same module.
mock.module("@/lib/mail/send", () => ({
  sendMail: async (opts: Mail) => {
    mails.push(opts);
    return { success: true, id: "sent-1" };
  },
  sendWelcomeEmail: async () => ({ success: true, id: "unused" }),
  mailSuppressionReason: () => null,
}));

const SENDER_NAME = "Lieferant GmbH lieferant-login.test";
const ACCESS_TOKEN = "c".repeat(64);

/** An unlinked relationship row, reached at the address the supplier typed. */
type Relationship = {
  readonly id: string;
  readonly customerCompanyId: null;
  readonly customerEmail: string;
};
const relationshipTo = (customerEmail: string, id = randomUUID()): Relationship => ({
  id,
  customerCompanyId: null,
  customerEmail,
});

/** What the current test put in the database; beforeEach resets it. */
const state: {
  relationship: Relationship | undefined;
  invite: { id: string; token: string; expiresAt: Date } | undefined;
  /** Whether the conditional re-send update still finds the row as it was read. */
  inviteUnchanged: boolean;
} = { relationship: undefined, invite: undefined, inviteUnchanged: true };
type Write = {
  readonly op: "insert" | "update";
  readonly table: unknown;
  readonly values: Record<string, unknown>;
};
const writes: Write[] = [];

const { incidentBroadcast } = await import("@/schema");

/**
 * The drizzle calls the three procedures make, and the module db that
 * notifyCustomerAdded reads. Conditions are opaque here, so each lookup
 * answers with the row the test set up.
 */
const db = {
  query: {
    company: {
      findFirst: async () => ({ actsAsSupplier: true, name: SENDER_NAME }),
    },
    supplier: {
      findFirst: async (opts: { columns: Record<string, boolean> }) =>
        opts.columns.unsubscribeToken
          ? { unsubscribeToken: ACCESS_TOKEN }
          : state.relationship,
    },
    supplierInvite: { findFirst: async () => state.invite },
  },
  insert: (table: unknown) => ({
    values: (values: Record<string, unknown>) => {
      writes.push({ op: "insert", table, values });
      // No broadcast row, so publish does not start a send this suite does not watch.
      const rows = table === incidentBroadcast ? [] : [{ id: randomUUID(), ...values }];
      return {
        onConflictDoNothing: () => ({ returning: async () => rows }),
        returning: async () => rows,
      };
    },
  }),
  update: (table: unknown) => ({
    set: (values: Record<string, unknown>) => ({
      where: () => {
        writes.push({ op: "update", table, values });
        return {
          returning: async () =>
            state.inviteUnchanged ? [{ id: state.invite?.id, ...values }] : [],
        };
      },
    }),
  }),
};
mock.module("@/lib/db", () => ({ db }));

const { createCallerFactory } = await import("../init");
const { supplierRelationshipRouter } = await import("./supplier-portal/relationship");
const { supplierIncidentRouter } = await import("./supplier-portal/incident");
const {
  INVITE_LIFETIME_MS,
  INVITE_RESEND_COOLDOWN_MS,
  canResendInvite,
  supplierInviteRouter,
} = await import("./supplier-invite");
const { SUPPLIER_MAIL_BUDGET } = await import("../helpers/supplier-mail-budget");
type TRPCContext = import("../init").TRPCContext;

const HOUR_MS = 60 * 60_000;

function contextFor(companyId: string): TRPCContext {
  return {
    db: db as unknown as TRPCContext["db"],
    session: {
      user: { id: "user-1" },
      role: "admin",
      accessLevel: "full",
    } as TRPCContext["session"],
    userId: "user-1",
    companyId,
    ip: "test",
    userAgent: null,
  };
}

const relationships = (companyId: string) =>
  createCallerFactory(supplierRelationshipRouter)(contextFor(companyId));
const incidents = (companyId: string) =>
  createCallerFactory(supplierIncidentRouter)(contextFor(companyId));
const invites = (companyId: string) =>
  createCallerFactory(supplierInviteRouter)(contextFor(companyId));

const address = (i: number) => `isb-${i}@kunde.test`;
const refusedWith = (budget: keyof typeof SUPPLIER_MAIL_BUDGET) => ({
  code: "TOO_MANY_REQUESTS",
  message: SUPPLIER_MAIL_BUDGET[budget].refusal,
});

/** notifyCustomerAdded is fire and forget, behind two lookups. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

const publish = (
  companyId: string,
  relationshipId: string,
  to = `isb-${relationshipId}@kunde.test`,
) => {
  state.relationship = relationshipTo(to, relationshipId);
  return incidents(companyId).publish({
    relationshipId,
    title: "Ausfall Rechenzentrum, Status unter status-lieferant.test",
    body: "Neues Passwort hier setzen: https://x.test/reset",
  });
};

beforeEach(() => {
  clock.now = 0;
  windows.clear();
  mails.splice(0);
  writes.splice(0);
  state.relationship = undefined;
  state.invite = undefined;
  state.inviteUnchanged = true;
});

describe("the budgets are the ones documented", () => {
  test("hourly per company, daily per customer and for new recipients", () => {
    const inHours = Object.fromEntries(
      Object.entries(SUPPLIER_MAIL_BUDGET).map(([name, budget]) => [
        name,
        { limit: budget.limit, hours: budget.windowMs / HOUR_MS },
      ]),
    );
    expect(inHours).toEqual({
      customerInvites: { limit: 100, hours: 1 },
      incidentNotices: { limit: 200, hours: 1 },
      incidentNoticesPerCustomer: { limit: 10, hours: 24 },
      supplierInvites: { limit: 100, hours: 1 },
      newRecipients: { limit: 200, hours: 24 },
      mailsPerInbox: { limit: 20, hours: 24 },
    });
  });
});

describe("a supplier adding customers", () => {
  test("mails a new address, with no link from the supplier's name", async () => {
    await relationships("supplier-a").invite({ customerEmail: "ISB@Kunde.test" });
    await settle();

    expect(mails.map((m) => m.to)).toEqual(["isb@kunde.test"]);
    const [mail] = mails;
    const whole = `${mail?.subject}\n${mail?.html}\n${mail?.text}`;
    expect(whole).not.toContain("lieferant-login.test");
    expect(mail?.subject).toBe(
      "Lieferant GmbH lieferant-login. test will send you their security updates",
    );
  });

  test("stops at 100 an hour, for that supplier only", async () => {
    const limit = SUPPLIER_MAIL_BUDGET.customerInvites.limit;
    for (let i = 0; i < limit; i++) {
      await relationships("supplier-a").invite({ customerEmail: address(i) });
    }
    await expect(
      relationships("supplier-a").invite({ customerEmail: address(limit) }),
    ).rejects.toMatchObject(refusedWith("customerInvites"));
    await relationships("supplier-b").invite({ customerEmail: address(0) });

    clock.now += HOUR_MS;
    await relationships("supplier-a").invite({ customerEmail: address(limit) });
  });

  test("an address already added is not mailed again and is not a new recipient", async () => {
    state.relationship = relationshipTo(address(0));
    const result = await relationships("supplier-a").invite({
      customerEmail: address(0),
    });
    await settle();

    expect(result).toEqual(state.relationship);
    expect(mails).toEqual([]);
    expect(writes).toEqual([]);
    expect(windows.size).toBe(1);
  });
});

describe("a supplier publishing incident notices", () => {
  test("stops at 10 a day to one customer, while other customers stay reachable", async () => {
    const customer = randomUUID();
    const limit = SUPPLIER_MAIL_BUDGET.incidentNoticesPerCustomer.limit;
    for (let i = 0; i < limit; i++) await publish("supplier-a", customer);
    await expect(publish("supplier-a", customer)).rejects.toMatchObject(
      refusedWith("incidentNoticesPerCustomer"),
    );
    await publish("supplier-a", randomUUID());

    clock.now += 24 * HOUR_MS;
    await publish("supplier-a", customer);
  });

  test("stops at 200 an hour across all customers", async () => {
    const perCustomer = SUPPLIER_MAIL_BUDGET.incidentNoticesPerCustomer.limit;
    const customers = Array.from(
      { length: SUPPLIER_MAIL_BUDGET.incidentNotices.limit / perCustomer },
      () => randomUUID(),
    );
    for (const customer of customers) {
      for (let i = 0; i < perCustomer; i++) await publish("supplier-a", customer);
    }
    await expect(publish("supplier-a", randomUUID())).rejects.toMatchObject(
      refusedWith("incidentNotices"),
    );
    await publish("supplier-b", randomUUID());
  });
});

describe("a customer inviting suppliers", () => {
  test("the mail says a message exists; the message itself stays on the invite", async () => {
    const message = "Bitte hier einloggen: https://x.test/login, Passwort ablaufend";
    await invites("customer-a").create({ toEmail: "security@lieferant.test", message });

    expect(mails).toHaveLength(1);
    const [mail] = mails;
    const whole = `${mail?.subject}\n${mail?.html}\n${mail?.text}`;
    expect(whole).not.toContain("x.test");
    expect(whole).not.toContain("Passwort");
    expect(whole).not.toContain("lieferant-login.test");
    expect(mail?.text).toContain("added a personal message");
    expect(writes).toEqual([
      expect.objectContaining({
        op: "insert",
        values: expect.objectContaining({ message }),
      }),
    ]);
  });

  test("50 suppliers in one afternoon all go out, and the budget stops at 100 an hour", async () => {
    const limit = SUPPLIER_MAIL_BUDGET.supplierInvites.limit;
    for (let i = 0; i < limit; i++) {
      await invites("customer-a").create({ toEmail: address(i) });
    }
    expect(mails).toHaveLength(limit);
    await expect(
      invites("customer-a").create({ toEmail: address(limit) }),
    ).rejects.toMatchObject(refusedWith("supplierInvites"));
    await invites("customer-b").create({ toEmail: address(0) });
  });
});

describe("the daily cap on new recipients", () => {
  test("counts both paths together, and leaves known addresses alone", async () => {
    const perHour = SUPPLIER_MAIL_BUDGET.customerInvites.limit;
    for (let i = 0; i < perHour; i++) {
      await relationships("company-a").invite({ customerEmail: address(i) });
    }
    clock.now += HOUR_MS;
    for (let i = perHour; i < SUPPLIER_MAIL_BUDGET.newRecipients.limit; i++) {
      await invites("company-a").create({ toEmail: address(i) });
    }
    clock.now += HOUR_MS;

    await expect(
      relationships("company-a").invite({ customerEmail: address(1000) }),
    ).rejects.toMatchObject(refusedWith("newRecipients"));
    await expect(
      invites("company-a").create({ toEmail: address(1001) }),
    ).rejects.toMatchObject(refusedWith("newRecipients"));

    state.relationship = relationshipTo(address(0));
    await relationships("company-a").invite({ customerEmail: address(0) });
    await publish("company-a", randomUUID());

    clock.now += 24 * HOUR_MS;
    state.relationship = undefined;
    await relationships("company-a").invite({ customerEmail: address(1000) });
  });
});

describe("one inbox behind many addresses", () => {
  test("victim+1@ to victim+N@ share one budget of 20 a day across the paths", async () => {
    const limit = SUPPLIER_MAIL_BUDGET.mailsPerInbox.limit;
    for (let i = 0; i < limit / 2; i++) {
      await relationships("supplier-a").invite({
        customerEmail: `victim+${i}@gmail.com`,
      });
    }
    for (let i = limit / 2; i < limit; i++) {
      await invites("supplier-a").create({ toEmail: `vic.tim+${i}@googlemail.com` });
    }

    await expect(
      relationships("supplier-a").invite({ customerEmail: "victim+x@gmail.com" }),
    ).rejects.toMatchObject(refusedWith("mailsPerInbox"));
    await expect(
      publish("supplier-a", randomUUID(), "v.i.c.t.i.m+y@gmail.com"),
    ).rejects.toMatchObject(refusedWith("mailsPerInbox"));
    await relationships("supplier-b").invite({ customerEmail: "victim@gmail.com" });
  });

  test("the stored address stays as typed", async () => {
    await relationships("supplier-a").invite({ customerEmail: "Victim+1@gmail.com" });
    expect(writes).toEqual([
      expect.objectContaining({
        op: "insert",
        values: expect.objectContaining({ customerEmail: "victim+1@gmail.com" }),
      }),
    ]);
  });
});

describe("sending an invite again", () => {
  /** An invite already on file, expiring `ms` from now (negative: revoked or run out). */
  const inviteExpiringIn = (ms: number) => ({
    id: randomUUID(),
    token: "d".repeat(64),
    expiresAt: new Date(Date.now() + ms),
  });

  test("is refused within 24 hours of the last send, without a write or a mail", async () => {
    state.invite = inviteExpiringIn(INVITE_LIFETIME_MS - HOUR_MS);
    await expect(
      invites("customer-a").create({ toEmail: address(0) }),
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(writes).toEqual([]);
    expect(mails).toEqual([]);
  });

  test("goes out with a new token once the cooldown is over, as no new recipient", async () => {
    state.invite = inviteExpiringIn(
      INVITE_LIFETIME_MS - INVITE_RESEND_COOLDOWN_MS - HOUR_MS,
    );
    await invites("customer-a").create({ toEmail: address(0) });

    expect(writes).toEqual([
      expect.objectContaining({
        op: "update",
        values: expect.objectContaining({ token: expect.any(String) }),
      }),
    ]);
    expect(mails).toHaveLength(1);
    expect([...windows.keys()].some((key) => key.includes("newRecipients"))).toBe(false);
  });

  test("an invite that ran out or was revoked goes out again at once", async () => {
    state.invite = inviteExpiringIn(-HOUR_MS);
    await invites("customer-a").create({ toEmail: address(0) });
    expect(mails).toHaveLength(1);
  });

  test("a revoke and invite again loop stops at the inbox budget", async () => {
    const limit = SUPPLIER_MAIL_BUDGET.mailsPerInbox.limit;
    for (let i = 0; i < limit; i++) {
      state.invite = inviteExpiringIn(-1);
      await invites("customer-a").create({ toEmail: address(0) });
    }
    state.invite = inviteExpiringIn(-1);
    await expect(
      invites("customer-a").create({ toEmail: address(0) }),
    ).rejects.toMatchObject(refusedWith("mailsPerInbox"));
    expect(mails).toHaveLength(limit);
  });

  test("two calls racing past the cooldown check send one mail", async () => {
    state.invite = inviteExpiringIn(-INVITE_LIFETIME_MS);
    state.inviteUnchanged = false;
    await expect(
      invites("customer-a").create({ toEmail: address(0) }),
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(mails).toEqual([]);
  });

  test("the cooldown boundary is exactly 24 hours after the send", () => {
    const at = new Date("2026-09-30T12:00:00Z");
    const sentAgo = (ms: number) => new Date(at.getTime() - ms + INVITE_LIFETIME_MS);
    expect(canResendInvite(sentAgo(INVITE_RESEND_COOLDOWN_MS - 1), at)).toBe(false);
    expect(canResendInvite(sentAgo(INVITE_RESEND_COOLDOWN_MS), at)).toBe(true);
  });
});
