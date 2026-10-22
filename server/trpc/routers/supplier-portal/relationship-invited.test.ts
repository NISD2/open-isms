/**
 * A company that already exists under an invited address still gets the customers that invited it:
 * opening the supplier portal binds their pending invites, the way accepting the link does for a
 * new account.
 */
import { describe, expect, mock, test } from "bun:test";

// The auto-audit middleware would otherwise reach for a real database.
mock.module("@/lib/audit", () => ({ logAudit: async () => {} }));

const { createCallerFactory } = await import("../../init");
const { supplierRelationshipRouter } = await import("./relationship");
const { supplier, supplierInvite } = await import("@/schema");
type TRPCContext = import("../../init").TRPCContext;

const USER = "11111111-1111-4111-8111-111111111111";
const MY_CO = "my-company";
const MY_EMAIL = "Security@Lieferant.test";

const inviteFrom = (fromCompanyId: string) => ({
  id: `invite-${fromCompanyId}`,
  fromCompanyId,
  toEmail: MY_EMAIL.toLowerCase(),
  token: "a".repeat(64),
  message: null,
  supplierId: null,
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 86_400_000),
  acceptedAt: null,
  acceptedByCompanyId: null,
});

type Write =
  | { readonly op: "relationship"; readonly values: Record<string, unknown> }
  | { readonly op: "accept"; readonly values: Record<string, unknown> };

/** The calls the two procedures make. `taken` is a customer address this company already holds. */
function setup(
  invites: readonly ReturnType<typeof inviteFrom>[],
  taken: ReadonlySet<string>,
) {
  const writes: Write[] = [];
  const db = {
    query: {
      user: { findFirst: async () => ({ email: MY_EMAIL }) },
      company: { findFirst: async () => ({ name: "Lieferant GmbH" }) },
      supplierInvite: { findMany: async () => invites },
      supplier: { findFirst: async () => undefined },
    },
    select: () => ({
      from: () => ({
        leftJoin: () => ({
          where: async () =>
            invites.map((i) => ({
              id: i.fromCompanyId,
              contactEmail: `kontakt@${i.fromCompanyId}.test`,
              ownerEmail: null,
            })),
        }),
      }),
    }),
    insert: (table: unknown) => ({
      values: (values: Record<string, unknown>) => ({
        onConflictDoNothing: () => ({
          returning: async () => {
            if (table !== supplier) throw new Error("unexpected insert");
            if (taken.has(String(values.customerEmail))) return [];
            writes.push({ op: "relationship", values });
            return [{ id: `relationship-${writes.length}` }];
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
  const caller = createCallerFactory(supplierRelationshipRouter)({
    db: db as unknown as TRPCContext["db"],
    session: { user: { id: USER, email: MY_EMAIL } } as TRPCContext["session"],
    userId: USER,
    companyId: MY_CO,
    ip: "test",
    userAgent: null,
  } as TRPCContext);
  return { caller, writes };
}

describe("bindInvitedCustomers", () => {
  test("each inviting customer becomes a relationship of this company, and its invite is accepted", async () => {
    const { caller, writes } = setup(
      [inviteFrom("kunde-a"), inviteFrom("kunde-b")],
      new Set(),
    );

    expect(await caller.bindInvitedCustomers()).toEqual({ bound: 2, left: 0 });

    const rows = writes.flatMap((w) => (w.op === "relationship" ? [w.values] : []));
    expect(rows.map((r) => r.customerCompanyId)).toEqual(["kunde-a", "kunde-b"]);
    expect(rows.every((r) => r.supplierCompanyId === MY_CO)).toBe(true);
    // The customer is reached at its own contact address, as for an accepted link.
    expect(rows.map((r) => r.customerEmail)).toEqual([
      "kontakt@kunde-a.test",
      "kontakt@kunde-b.test",
    ]);
    const accepted = writes.flatMap((w) => (w.op === "accept" ? [w.values] : []));
    expect(accepted).toHaveLength(2);
    expect(accepted.every((a) => a.acceptedByCompanyId === MY_CO)).toBe(true);
  });

  test("an address this company already holds leaves that invite pending and is counted", async () => {
    const { caller, writes } = setup(
      [inviteFrom("kunde-a"), inviteFrom("kunde-b")],
      new Set(["kontakt@kunde-b.test"]),
    );

    expect(await caller.bindInvitedCustomers()).toEqual({ bound: 1, left: 1 });
    expect(writes.filter((w) => w.op === "accept")).toHaveLength(1);
  });

  test("nothing pending writes nothing", async () => {
    const { caller, writes } = setup([], new Set());

    expect(await caller.bindInvitedCustomers()).toEqual({ bound: 0, left: 0 });
    expect(writes).toEqual([]);
  });
});

describe("pendingInvitedCount", () => {
  test("counts the open invites to the signed-in address", async () => {
    const { caller } = setup([inviteFrom("kunde-a"), inviteFrom("kunde-b")], new Set());
    expect(await caller.pendingInvitedCount()).toBe(2);
  });
});
