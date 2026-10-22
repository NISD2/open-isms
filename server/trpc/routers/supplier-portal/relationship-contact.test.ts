/**
 * A supplier adds a customer without an email and adds people later, as many as it likes, each with
 * a link of their own; takes one person's access away without touching the others; and deletes
 * the customer. A customer with an account of its own is reached at the address it keeps there.
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
const { supplierContactRouter } = await import("./contact-router");
const { supplierRelationshipRouter } = await import("./relationship");
const { supplier, supplierContact } = await import("@/schema");
type TRPCContext = import("../../init").TRPCContext;

const USER = "11111111-1111-4111-8111-111111111111";
const MY_CO = "my-company";
const REL = "22222222-2222-4222-8222-222222222222";
const CONTACT = "33333333-3333-4333-8333-333333333333";

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
  customerEmail: "erste@kunde.test",
  customerOrgName: "Kunde GmbH",
  status: "active",
  ...over,
});

type Added = { readonly id: string; readonly email: string };

/**
 * The calls the contact procedures make. `lookups` answers the supplier lookups in the order the
 * procedure makes them (`undefined` means no row); `added` is the people already added to the
 * customer; `contactDeleted` is whether a delete of a contact matches a row.
 */
function setup(
  lookups: readonly (Rel | undefined)[],
  added: readonly Added[] = [],
  contactDeleted = true,
) {
  budgetKeys.length = 0;
  const queue = [...lookups];
  const inserted: { table: unknown; values: Record<string, unknown> }[] = [];
  const updated: Record<string, unknown>[] = [];
  const deleted: unknown[] = [];
  const db = {
    query: {
      company: {
        findFirst: async () => ({ name: "Lieferant GmbH", actsAsSupplier: true }),
      },
      supplier: { findFirst: async () => queue.shift() },
      supplierContact: { findMany: async () => added },
    },
    select: () => ({
      // The `contacts` query's rows are named for the client: contactId, not id.
      from: () => ({
        where: () => ({
          orderBy: async () => added.map((a) => ({ contactId: a.id, email: a.email })),
        }),
      }),
    }),
    insert: (table: unknown) => ({
      values: (values: Record<string, unknown>) => ({
        onConflictDoNothing: () => ({
          returning: async () => {
            inserted.push({ table, values });
            return [{ id: table === supplierContact ? CONTACT : REL }];
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
    delete: (table: unknown) => ({
      where: () => ({
        returning: async () => {
          deleted.push(table);
          return table === supplierContact && !contactDeleted ? [] : [{ id: CONTACT }];
        },
      }),
    }),
  };
  const ctx = {
    db: db as unknown as TRPCContext["db"],
    session: { user: { id: USER, email: "me@lieferant.test" } } as TRPCContext["session"],
    userId: USER,
    companyId: MY_CO,
    ip: "test",
    userAgent: null,
  } as TRPCContext;
  const relationship = createCallerFactory(supplierRelationshipRouter)(ctx);
  const contact = createCallerFactory(supplierContactRouter)(ctx);
  // One caller for both routers, so the tests read as the supplier's one set of actions.
  const caller = {
    invite: relationship.invite,
    addContact: contact.add,
    contacts: contact.list,
    removeContact: contact.remove,
  };
  return { caller, inserted, updated, deleted };
}

const contactInserts = (
  inserted: { table: unknown; values: Record<string, unknown> }[],
) => inserted.filter((i) => i.table === supplierContact).map((i) => i.values);

describe("invite without an email", () => {
  test("adds the customer under its company name, with no address and no mail budget spent", async () => {
    const { caller, inserted } = setup([undefined]);

    await caller.invite({ customerOrgName: "  Kunde GmbH  " });

    expect(inserted).toHaveLength(1);
    expect(inserted[0]?.values).toMatchObject({
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

describe("addContact", () => {
  test("the first address of a customer goes on its row, under a new link", async () => {
    const { caller, updated, inserted } = setup([
      rel({ customerEmail: null }),
      undefined,
    ]);

    await caller.addContact({ id: REL, customerEmail: "Erste@Kunde.test" });

    expect(updated).toHaveLength(1);
    expect(updated[0]).toMatchObject({
      customerEmail: "erste@kunde.test",
      status: "active",
      unsubscribedAt: null,
    });
    expect(String(updated[0]?.unsubscribeToken)).toHaveLength(64);
    expect(contactInserts(inserted)).toEqual([]);
  });

  test("a second person is added with a link of their own, and the first keeps theirs", async () => {
    const { caller, updated, inserted } = setup([rel(), undefined]);

    await caller.addContact({ id: REL, customerEmail: "Zweite@Kunde.test" });

    expect(contactInserts(inserted)).toHaveLength(1);
    expect(contactInserts(inserted)[0]).toMatchObject({
      relationshipId: REL,
      email: "zweite@kunde.test",
    });
    expect(String(contactInserts(inserted)[0]?.accessToken)).toMatch(/^[0-9a-f]{64}$/);
    // The row's own address and link are not touched.
    expect(updated).toEqual([]);
  });

  test("every person gets a different link", async () => {
    const first = setup([rel(), undefined]);
    const second = setup([rel(), undefined]);

    await first.caller.addContact({ id: REL, customerEmail: "a@kunde.test" });
    await second.caller.addContact({ id: REL, customerEmail: "b@kunde.test" });

    expect(contactInserts(second.inserted)[0]?.accessToken).not.toEqual(
      contactInserts(first.inserted)[0]?.accessToken,
    );
  });

  test("an address the customer already has is sent its link once more, nothing is added", async () => {
    const onRow = setup([rel({ customerEmail: "erste@kunde.test" })]);
    await onRow.caller.addContact({ id: REL, customerEmail: "ERSTE@kunde.test" });
    expect(onRow.inserted).toEqual([]);
    expect(onRow.updated).toEqual([]);

    const added = setup([rel()], [{ id: CONTACT, email: "zweite@kunde.test" }]);
    await added.caller.addContact({ id: REL, customerEmail: "zweite@kunde.test" });
    expect(added.inserted).toEqual([]);
    // A resend is not a new recipient.
    expect(budgetKeys.some((k) => k.includes("newRecipients"))).toBe(false);
  });

  test("a new person counts every mail budget", async () => {
    const { caller } = setup([rel(), undefined]);

    await caller.addContact({ id: REL, customerEmail: "neu@kunde.test" });

    for (const budget of ["customerInvites", "mailsPerInbox", "newRecipients"]) {
      expect(budgetKeys.some((k) => k.includes(budget))).toBe(true);
    }
  });

  test("an address that is another customer of yours is refused", async () => {
    const { caller, inserted, updated } = setup([rel(), rel({ id: "other" })]);

    await expect(
      caller.addContact({ id: REL, customerEmail: "neu@kunde.test" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect(inserted).toEqual([]);
    expect(updated).toEqual([]);
  });

  test("a customer can have as many people as the cap, and no more", async () => {
    const full = Array.from({ length: 50 }, (_, i) => ({
      id: `c-${i}`,
      email: `p${i}@kunde.test`,
    }));
    const { caller, inserted } = setup([rel(), undefined], full);

    await expect(
      caller.addContact({ id: REL, customerEmail: "einer-zu-viel@kunde.test" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(inserted).toEqual([]);
  });

  test("a customer with an account of its own takes no one", async () => {
    const { caller, inserted, updated } = setup([rel({ customerCompanyId: "kunde-co" })]);

    await expect(
      caller.addContact({ id: REL, customerEmail: "neu@kunde.test" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(inserted).toEqual([]);
    expect(updated).toEqual([]);
  });

  test("a customer that is not yours, or was removed, is not found", async () => {
    const gone = setup([undefined]);
    await expect(
      gone.caller.addContact({ id: REL, customerEmail: "neu@kunde.test" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    const removed = setup([rel({ status: "revoked" })]);
    await expect(
      removed.caller.addContact({ id: REL, customerEmail: "neu@kunde.test" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(gone.inserted.concat(removed.inserted)).toEqual([]);
  });
});

describe("contacts", () => {
  test("lists the address on the row first, then the people added", async () => {
    const { caller } = setup(
      [rel()],
      [
        { id: "c-1", email: "zweite@kunde.test" },
        { id: "c-2", email: "dritte@kunde.test" },
      ],
    );

    expect(await caller.contacts({ id: REL })).toEqual([
      { contactId: null, email: "erste@kunde.test" },
      { contactId: "c-1", email: "zweite@kunde.test" },
      { contactId: "c-2", email: "dritte@kunde.test" },
    ]);
  });

  test("a customer with an account of its own lists no one", async () => {
    const { caller } = setup([rel({ customerCompanyId: "kunde-co" })]);
    expect(await caller.contacts({ id: REL })).toEqual([]);
  });

  test("a customer that is not yours is not found", async () => {
    const { caller } = setup([undefined]);
    await expect(caller.contacts({ id: REL })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});

describe("removeContact", () => {
  test("one named person is removed, and no one else", async () => {
    const { caller, deleted, updated } = setup([rel()]);

    await caller.removeContact({ id: REL, contactId: CONTACT });

    expect(deleted).toEqual([supplierContact]);
    // The row's own address and link stay.
    expect(updated).toEqual([]);
  });

  test("a person who is not at this customer is not found", async () => {
    const { caller } = setup([rel()], [], false);

    await expect(
      caller.removeContact({ id: REL, contactId: CONTACT }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  test("with no one named, the address on the row goes and its link stops working", async () => {
    const { caller, updated, deleted } = setup([rel()]);

    await caller.removeContact({ id: REL });

    expect(updated).toHaveLength(1);
    expect(updated[0]).toMatchObject({ customerEmail: null });
    expect(String(updated[0]?.unsubscribeToken)).toHaveLength(64);
    // The customer is not ended: status is left alone, and no one else is touched.
    expect(updated[0]).not.toHaveProperty("status");
    expect(deleted).toEqual([]);
  });

  test("a customer with no company name would be left nameless and is refused", async () => {
    const { caller, updated } = setup([rel({ customerOrgName: null })]);

    await expect(caller.removeContact({ id: REL })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(updated).toEqual([]);
  });

  test("a customer with an account of its own keeps the address it has there", async () => {
    const { caller, updated, deleted } = setup([rel({ customerCompanyId: "kunde-co" })]);

    await expect(
      caller.removeContact({ id: REL, contactId: CONTACT }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(updated).toEqual([]);
    expect(deleted).toEqual([]);
  });
});

/**
 * The two statements `remove` makes. The conditions are opaque to a fake, so `outcome` says what
 * the database would answer: the row is the supplier's own and is deleted, it is linked to the
 * customer's own account (the delete matches nothing, the update ends it), or it is not there.
 */
function setupRemove(outcome: "deleted" | "linked" | "missing") {
  const deletes: unknown[] = [];
  const updated: Record<string, unknown>[] = [];
  const db = {
    delete: (table: unknown) => ({
      where: () => ({
        returning: async () => {
          if (table !== supplier) throw new Error("unexpected delete");
          deletes.push(table);
          return outcome === "deleted" ? [{ id: REL }] : [];
        },
      }),
    }),
    update: (table: unknown) => ({
      set: (values: Record<string, unknown>) => ({
        where: () => ({
          returning: async () => {
            if (table !== supplier) throw new Error("unexpected update");
            updated.push(values);
            return outcome === "linked" ? [{ id: REL }] : [];
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
  return { caller, deletes, updated };
}

describe("remove (delete customer)", () => {
  test("a customer the supplier added itself is deleted, not just hidden", async () => {
    const { caller, deletes, updated } = setupRemove("deleted");

    expect(await caller.remove({ id: REL })).toEqual({ id: REL, deleted: true });
    expect(deletes).toHaveLength(1);
    expect(updated).toEqual([]);
  });

  test("a customer with its own account is not deleted: its access ends and it leaves the list", async () => {
    const { caller, updated } = setupRemove("linked");

    expect(await caller.remove({ id: REL })).toEqual({ id: REL, deleted: false });
    expect(updated).toHaveLength(1);
    expect(updated[0]).toMatchObject({ status: "revoked" });
  });

  test("a customer that is not the caller's is not found", async () => {
    const { caller, deletes } = setupRemove("missing");

    await expect(caller.remove({ id: REL })).rejects.toMatchObject({ code: "NOT_FOUND" });
    // Both statements run and match no row; nothing is reported as deleted.
    expect(deletes).toHaveLength(1);
  });
});
