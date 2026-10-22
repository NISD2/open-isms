/**
 * A customer's people each hold a link of their own. Pinned here: a link opens the customer it
 * belongs to whether it is the row's own or one person's, a person who ends their own access ends
 * theirs and no one else's, and everyone at the customer is mailed with the link that is theirs.
 */
import { describe, expect, mock, test } from "bun:test";

// The auto-audit middleware and the public router's explicit audit would reach for a database.
mock.module("@/lib/audit", () => ({ logAudit: async () => {} }));
mock.module("@/lib/rate-limit", () => ({ rateLimit: async () => true }));

const { createCallerFactory } = await import("../../init");
const { supplierPublicRouter } = await import("./public");
const { accessByToken, recipientsOf } = await import("./contacts");
const { supplier, supplierContact } = await import("@/schema");
type DbOrTx = import("@/lib/db").DbOrTx;
type TRPCContext = import("../../init").TRPCContext;

const ROW_TOKEN = "a".repeat(64);
const PERSON_TOKEN = "b".repeat(64);
const REL = "22222222-2222-4222-8222-222222222222";
const CONTACT = "33333333-3333-4333-8333-333333333333";

const relRow = {
  id: REL,
  supplierCompanyId: "supplier-co",
  customerCompanyId: null,
  customerEmail: "erste@kunde.test",
  unsubscribeToken: ROW_TOKEN,
  status: "active" as const,
};
const contactRow = {
  id: CONTACT,
  relationshipId: REL,
  email: "zweite@kunde.test",
  accessToken: PERSON_TOKEN,
};

/** A database that holds one customer row and one added person; conditions are opaque, so a lookup
 * answers by which token the test says was asked. */
function fakeDb(asked: "row" | "person" | "unknown") {
  const deleted: unknown[] = [];
  const updated: Record<string, unknown>[] = [];
  const db = {
    query: {
      supplier: {
        // First lookup is by the row's own token, the second (after a contact) by id.
        findFirst: (() => {
          let calls = 0;
          return async () => {
            calls += 1;
            if (calls === 1) return asked === "row" ? relRow : undefined;
            return asked === "person" ? relRow : undefined;
          };
        })(),
      },
      supplierContact: {
        findFirst: async () => (asked === "person" ? contactRow : undefined),
      },
    },
    delete: (table: unknown) => ({
      where: async () => {
        deleted.push(table);
      },
    }),
    update: (table: unknown) => ({
      set: (values: Record<string, unknown>) => ({
        where: async () => {
          if (table === supplier) updated.push(values);
        },
      }),
    }),
    // Added people for recipientsOf.
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () => [
            { id: CONTACT, email: contactRow.email, token: contactRow.accessToken },
          ],
        }),
      }),
    }),
  };
  return { db, deleted, updated };
}

describe("accessByToken", () => {
  test("the row's own link opens the customer", async () => {
    const { db } = fakeDb("row");
    const access = await accessByToken(db as unknown as DbOrTx, ROW_TOKEN);
    expect(access?.rel.id).toBe(REL);
    expect(access?.via).toEqual({ kind: "row" });
  });

  test("a person's link opens the same customer and says whose it is", async () => {
    const { db } = fakeDb("person");
    const access = await accessByToken(db as unknown as DbOrTx, PERSON_TOKEN);
    expect(access?.rel.id).toBe(REL);
    expect(access?.via).toEqual({
      kind: "contact",
      contactId: CONTACT,
      email: "zweite@kunde.test",
    });
  });

  test("a link that belongs to no one opens nothing", async () => {
    const { db } = fakeDb("unknown");
    expect(await accessByToken(db as unknown as DbOrTx, "f".repeat(64))).toBeNull();
  });
});

describe("recipientsOf", () => {
  test("the address on the row first, then each added person, each with their own link", async () => {
    const { db } = fakeDb("row");
    expect(await recipientsOf(db as unknown as DbOrTx, relRow)).toEqual([
      { email: "erste@kunde.test", token: ROW_TOKEN, contactId: null },
      { email: "zweite@kunde.test", token: PERSON_TOKEN, contactId: CONTACT },
    ]);
  });

  test("a customer with no address on its row is reached at the people added", async () => {
    const { db } = fakeDb("row");
    expect(
      await recipientsOf(db as unknown as DbOrTx, { ...relRow, customerEmail: null }),
    ).toEqual([{ email: "zweite@kunde.test", token: PERSON_TOKEN, contactId: CONTACT }]);
  });
});

describe("a customer ending their own access (public.revoke)", () => {
  const caller = (db: unknown) =>
    createCallerFactory(supplierPublicRouter)({
      db: db as TRPCContext["db"],
      session: null,
      userId: null,
      companyId: null,
      ip: "203.0.113.7",
      userAgent: null,
    } as unknown as TRPCContext);

  test("a person's link ends that person's access only: their contact goes, the customer stays", async () => {
    const { db, deleted, updated } = fakeDb("person");

    expect(await caller(db).revoke({ token: PERSON_TOKEN })).toEqual({ ok: true });
    expect(deleted).toEqual([supplierContact]);
    // The customer is not revoked, so the other people keep their links.
    expect(updated).toEqual([]);
  });

  test("the row's own link ends the customer's access, as before", async () => {
    const { db, deleted, updated } = fakeDb("row");

    expect(await caller(db).revoke({ token: ROW_TOKEN })).toEqual({ ok: true });
    expect(updated).toEqual([expect.objectContaining({ status: "revoked" })]);
    expect(deleted).toEqual([]);
  });

  test("a link that belongs to no one is not found", async () => {
    const { db, deleted, updated } = fakeDb("unknown");

    await expect(caller(db).revoke({ token: "f".repeat(64) })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect(deleted).toEqual([]);
    expect(updated).toEqual([]);
  });
});
