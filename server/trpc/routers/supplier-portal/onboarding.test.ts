/**
 * Accepting a supplier invite binds the new supplier company to every customer
 * that invited the address. The relationship row carries the customer's contact
 * address, where incident broadcasts and their access links are mailed, and an
 * invite is only marked accepted once its row exists.
 */
import { describe, expect, mock, test } from "bun:test";

// The auto-audit middleware would otherwise reach for a real database.
mock.module("@/lib/audit", () => ({ logAudit: async () => {} }));

const { createCallerFactory } = await import("../../init");
const { supplierOnboardingRouter } = await import("./onboarding");
const { company, supplier, supplierInvite } = await import("@/schema");
type TRPCContext = import("../../init").TRPCContext;

const USER = "11111111-1111-4111-8111-111111111111";
const SUPPLIER_EMAIL = "security@lieferant.test";
const SUPPLIER_CO = "supplier-co";
const TOKEN = "a".repeat(64);

type Invite = {
  readonly id: string;
  readonly fromCompanyId: string;
  readonly toEmail: string;
  readonly token: string;
  readonly message: null;
  readonly createdAt: Date;
  readonly expiresAt: Date;
  readonly acceptedAt: null;
  readonly acceptedByCompanyId: null;
};

type Customer = {
  readonly id: string;
  readonly contactEmail: string | null;
  readonly ownerEmail: string | null;
};

type Write =
  | {
      readonly op: "relationship";
      readonly customerCompanyId: unknown;
      readonly customerEmail: unknown;
      readonly created: boolean;
    }
  | { readonly op: "accept"; readonly values: Record<string, unknown> };

const inviteFrom = (id: string, fromCompanyId: string, token: string): Invite => ({
  id,
  fromCompanyId,
  toEmail: SUPPLIER_EMAIL,
  token,
  message: null,
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 86_400_000),
  acceptedAt: null,
  acceptedByCompanyId: null,
});

/**
 * The drizzle calls acceptInvite and its helpers make. Conditions are opaque
 * here: the first invite is the one the token names, the rest are the other
 * pending invites to the same address. Supplier inserts honour
 * uq_supplier_portal_share, with NULL emails never colliding, as in Postgres.
 */
function fakeDb(
  invites: readonly Invite[],
  customers: readonly Customer[],
  writes: Write[],
) {
  const [clicked, ...others] = invites;
  const shares: { supplierCompanyId: unknown; customerEmail: unknown }[] = [];
  const db = {
    query: {
      user: { findFirst: async () => ({ email: SUPPLIER_EMAIL, grandfatheredAt: null }) },
      supplierInvite: {
        findFirst: async () => clicked,
        findMany: async () => others,
      },
    },
    select: () => ({
      from: () => ({
        // listUserCompanies: the caller belongs to no company yet.
        innerJoin: () => ({ where: () => ({ orderBy: async () => [] }) }),
        // The inviting customers' contact addresses.
        leftJoin: () => ({ where: async () => customers }),
        // isFeatureOn: every flag off.
        where: () => ({ limit: async () => [] }),
      }),
    }),
    insert: (table: unknown) => ({
      values: (values: Record<string, unknown>) => ({
        returning: async () => [{ id: table === company ? SUPPLIER_CO : "billing-1" }],
        onConflictDoUpdate: async () => {},
        onConflictDoNothing: () => ({
          returning: async () => {
            if (table !== supplier) throw new Error("unexpected insert");
            const taken =
              values.customerEmail != null &&
              shares.some(
                (s) =>
                  s.supplierCompanyId === values.supplierCompanyId &&
                  s.customerEmail === values.customerEmail,
              );
            writes.push({
              op: "relationship",
              customerCompanyId: values.customerCompanyId,
              customerEmail: values.customerEmail,
              created: !taken,
            });
            if (taken) return [];
            shares.push({
              supplierCompanyId: values.supplierCompanyId,
              customerEmail: values.customerEmail,
            });
            return [{ id: `relationship-${shares.length}` }];
          },
        }),
      }),
    }),
    update: (table: unknown) => ({
      set: (values: Record<string, unknown>) => ({
        where: async () => {
          if (table === supplierInvite) writes.push({ op: "accept", values });
        },
      }),
    }),
    transaction: async <T>(fn: (tx: unknown) => Promise<T>) => fn(db),
  };
  return db;
}

async function accept(invites: readonly Invite[], customers: readonly Customer[]) {
  const writes: Write[] = [];
  const caller = createCallerFactory(supplierOnboardingRouter)({
    db: fakeDb(invites, customers, writes) as unknown as TRPCContext["db"],
    session: { user: { id: USER, email: SUPPLIER_EMAIL } } as TRPCContext["session"],
    userId: USER,
    companyId: null,
    ip: "test",
    userAgent: null,
  } as TRPCContext);
  const result = await caller.acceptInvite({ token: TOKEN, name: "Lieferant GmbH" });
  return { result, writes };
}

/** Every acceptance directly follows the relationship row created for it. */
function expectEveryAcceptanceHasItsRow(writes: readonly Write[]) {
  writes.forEach((write, i) => {
    if (write.op !== "accept") return;
    const before = writes[i - 1];
    expect(before?.op === "relationship" && before.created).toBe(true);
    expect(write.values).toMatchObject({ acceptedByCompanyId: SUPPLIER_CO });
  });
}

const relationships = (writes: readonly Write[]) =>
  writes.flatMap((w) => (w.op === "relationship" && w.created ? [w] : []));
const acceptances = (writes: readonly Write[]) => writes.filter((w) => w.op === "accept");

describe("supplierOnboarding.acceptInvite", () => {
  test("one invite binds the customer at the customer's contact address, not the supplier's", async () => {
    const { result, writes } = await accept(
      [inviteFrom("invite-a", "customer-a", TOKEN)],
      [
        {
          id: "customer-a",
          contactEmail: "ISB@Kunde-A.test",
          ownerEmail: "owner@kunde-a.test",
        },
      ],
    );

    expect(relationships(writes)).toEqual([
      {
        op: "relationship",
        customerCompanyId: "customer-a",
        customerEmail: "isb@kunde-a.test",
        created: true,
      },
    ]);
    expect(acceptances(writes)).toHaveLength(1);
    expectEveryAcceptanceHasItsRow(writes);
    expect(result).toEqual({
      companyId: SUPPLIER_CO,
      boundEntities: 1,
      unboundInvites: 0,
    });
  });

  test("two customers inviting the same address each get their own relationship", async () => {
    const { result, writes } = await accept(
      [
        inviteFrom("invite-a", "customer-a", TOKEN),
        inviteFrom("invite-b", "customer-b", "b".repeat(64)),
      ],
      [
        { id: "customer-a", contactEmail: "isb@kunde-a.test", ownerEmail: null },
        // No contact address on file: the owner is who is reached.
        { id: "customer-b", contactEmail: null, ownerEmail: "Owner@Kunde-B.test" },
      ],
    );

    expect(
      relationships(writes).map((w) => [w.customerCompanyId, w.customerEmail]),
    ).toEqual([
      ["customer-a", "isb@kunde-a.test"],
      ["customer-b", "owner@kunde-b.test"],
    ]);
    expect(acceptances(writes)).toHaveLength(2);
    expectEveryAcceptanceHasItsRow(writes);
    expect(result).toEqual({
      companyId: SUPPLIER_CO,
      boundEntities: 2,
      unboundInvites: 0,
    });
  });

  // uq_supplier_portal_share is (supplier company, customer email), so two
  // customer companies reached at one address cannot both hold a row.
  test("a customer whose address is already bound stays pending instead of accepted without a row", async () => {
    const { result, writes } = await accept(
      [
        inviteFrom("invite-a", "customer-a", TOKEN),
        inviteFrom("invite-b", "customer-b", "b".repeat(64)),
      ],
      [
        { id: "customer-a", contactEmail: null, ownerEmail: "gf@holding.test" },
        { id: "customer-b", contactEmail: null, ownerEmail: "gf@holding.test" },
      ],
    );

    expect(relationships(writes).map((w) => w.customerCompanyId)).toEqual(["customer-a"]);
    expect(acceptances(writes)).toHaveLength(1);
    expectEveryAcceptanceHasItsRow(writes);
    expect(result).toEqual({
      companyId: SUPPLIER_CO,
      boundEntities: 1,
      unboundInvites: 1,
    });
  });
});
