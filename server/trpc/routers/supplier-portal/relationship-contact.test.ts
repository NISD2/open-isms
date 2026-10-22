/**
 * A supplier adds a customer without an email and adds the email later; replaces the contact, which
 * kills the old link and sends the new one; or takes the contact's access away and keeps the
 * customer. A customer with an account of its own is reached at the address it keeps there.
 */
import { describe, expect, mock, test } from "bun:test";

// The auto-audit middleware would otherwise reach for a real database.
mock.module("@/lib/audit", () => ({ logAudit: async () => {} }));
// The budgets run with a rate limit that always has room; the keys show which ones were counted.
const budgetKeys: string[] = [];
mock.module("@/lib/rate-limit", () => ({
  rateLimit: async (key: string) => {
    budgetKeys.push(key);
    return true;
  },
}));

const { createCallerFactory } = await import("../../init");
const { supplierRelationshipRouter } = await import("./relationship");
const { supplier } = await import("@/schema");
type TRPCContext = import("../../init").TRPCContext;

const USER = "11111111-1111-4111-8111-111111111111";
const MY_CO = "my-company";
const REL = "22222222-2222-4222-8222-222222222222";

type Rel = {
  readonly id: string;
  readonly customerCompanyId: string | null;
  readonly customerEmail: string | null;
  readonly customerOrgName: string | null;
  readonly status: "active" | "revoked" | "bounced";
};

const rel = (over: Partial<Rel> = {}): Rel => ({
  id: REL,
  customerCompanyId: null,
  customerEmail: "alt@kunde.test",
  customerOrgName: "Kunde GmbH",
  status: "active",
  ...over,
});

/**
 * The calls the three procedures make. `lookups` answers the supplier lookups in the order the
 * procedure makes them; `undefined` means no row.
 */
function setup(lookups: readonly (Rel | undefined)[]) {
  budgetKeys.length = 0;
  const queue = [...lookups];
  const inserted: Record<string, unknown>[] = [];
  const updated: Record<string, unknown>[] = [];
  const db = {
    query: {
      company: {
        findFirst: async () => ({ name: "Lieferant GmbH", actsAsSupplier: true }),
      },
      supplier: { findFirst: async () => queue.shift() },
    },
    insert: (table: unknown) => ({
      values: (values: Record<string, unknown>) => ({
        onConflictDoNothing: () => ({
          returning: async () => {
            if (table !== supplier) throw new Error("unexpected insert");
            inserted.push(values);
            return [{ id: REL }];
          },
        }),
      }),
    }),
    update: (table: unknown) => ({
      set: (values: Record<string, unknown>) => ({
        where: () => ({
          returning: async () => {
            if (table !== supplier) throw new Error("unexpected update");
            updated.push(values);
            return [{ id: REL }];
          },
        }),
      }),
    }),
  };
  const caller = createCallerFactory(supplierRelationshipRouter)({
    db: db as unknown as TRPCContext["db"],
    session: { user: { id: USER, email: "me@lieferant.test" } } as TRPCContext["session"],
    userId: USER,
    companyId: MY_CO,
    ip: "test",
    userAgent: null,
  } as TRPCContext);
  return { caller, inserted, updated };
}

describe("invite without an email", () => {
  test("adds the customer under its company name, with no address and no mail budget spent", async () => {
    const { caller, inserted } = setup([undefined]);

    await caller.invite({ customerOrgName: "  Kunde GmbH  " });

    expect(inserted).toHaveLength(1);
    expect(inserted[0]).toMatchObject({
      supplierCompanyId: MY_CO,
      customerCompanyId: null,
      customerEmail: null,
      customerOrgName: "Kunde GmbH",
      status: "active",
    });
    // No address, so no mail and nothing counted against the recipient budgets.
    expect(
      budgetKeys.some((k) => k.includes("newRecipients") || k.includes("mailsPerInbox")),
    ).toBe(false);
  });

  test("the same company name again returns the customer already added", async () => {
    const { caller, inserted } = setup([rel({ customerEmail: null })]);

    // The real lookup selects the id alone; the fake answers with the whole row.
    expect(await caller.invite({ customerOrgName: "Kunde GmbH" })).toMatchObject({
      id: REL,
    });
    expect(inserted).toEqual([]);
  });

  test("neither a name nor an email is refused before anything is written", async () => {
    const { caller, inserted } = setup([]);

    await expect(caller.invite({ customerOrgName: "   " })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(inserted).toEqual([]);
  });
});

describe("setContact", () => {
  test("adds the email to a customer that has none, under a new link", async () => {
    const { caller, updated } = setup([rel({ customerEmail: null }), undefined]);

    await caller.setContact({ id: REL, customerEmail: "Neu@Kunde.test" });

    expect(updated).toHaveLength(1);
    expect(updated[0]).toMatchObject({
      customerEmail: "neu@kunde.test",
      status: "active",
      unsubscribedAt: null,
    });
    expect(String(updated[0]?.unsubscribeToken)).toHaveLength(64);
  });

  test("replacing the email gives a new link, so the old one stops working", async () => {
    const first = setup([rel(), undefined]);
    const second = setup([rel(), undefined]);

    await first.caller.setContact({ id: REL, customerEmail: "neu@kunde.test" });
    await second.caller.setContact({ id: REL, customerEmail: "neu@kunde.test" });

    expect(first.updated[0]).toMatchObject({ customerEmail: "neu@kunde.test" });
    // A token is generated per change, never reused or left as it was.
    expect(second.updated[0]?.unsubscribeToken).not.toEqual(
      first.updated[0]?.unsubscribeToken,
    );
  });

  test("an address another customer of yours already has is refused", async () => {
    const { caller, updated } = setup([rel(), rel({ id: "other" })]);

    await expect(
      caller.setContact({ id: REL, customerEmail: "neu@kunde.test" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect(updated).toEqual([]);
  });

  test("the same address again sends the link once more and changes nothing", async () => {
    const { caller, updated } = setup([rel({ customerEmail: "alt@kunde.test" })]);

    expect(await caller.setContact({ id: REL, customerEmail: "ALT@kunde.test" })).toEqual(
      {
        id: REL,
      },
    );
    expect(updated).toEqual([]);
  });

  test("a customer with an account of its own is not edited here", async () => {
    const { caller, updated } = setup([rel({ customerCompanyId: "kunde-co" })]);

    await expect(
      caller.setContact({ id: REL, customerEmail: "neu@kunde.test" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(updated).toEqual([]);
  });

  test("a customer that is not yours, or was removed, is not found", async () => {
    const gone = setup([undefined]);
    await expect(
      gone.caller.setContact({ id: REL, customerEmail: "neu@kunde.test" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    const removed = setup([rel({ status: "revoked" })]);
    await expect(
      removed.caller.setContact({ id: REL, customerEmail: "neu@kunde.test" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(gone.updated.concat(removed.updated)).toEqual([]);
  });
});

describe("removeContact", () => {
  test("clears the address and the link, and keeps the customer", async () => {
    const { caller, updated } = setup([rel()]);

    await caller.removeContact({ id: REL });

    expect(updated).toHaveLength(1);
    expect(updated[0]).toMatchObject({ customerEmail: null });
    expect(String(updated[0]?.unsubscribeToken)).toHaveLength(64);
    // The row is not ended: status is left alone, so the customer stays in the list.
    expect(updated[0]).not.toHaveProperty("status");
  });

  test("a customer with no company name would be left nameless and is refused", async () => {
    const { caller, updated } = setup([rel({ customerOrgName: null })]);

    await expect(caller.removeContact({ id: REL })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(updated).toEqual([]);
  });

  test("a customer with an account of its own keeps the address it has there", async () => {
    const { caller, updated } = setup([rel({ customerCompanyId: "kunde-co" })]);

    await expect(caller.removeContact({ id: REL })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(updated).toEqual([]);
  });
});
