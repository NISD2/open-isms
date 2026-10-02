/**
 * An invite sent for a row of the sender's own supplier list carries that row, so the reply links
 * it instead of adding a second one. Pinned here: the row must be the sender's and not linked yet;
 * any other id is refused before anything is written or mailed.
 */
import { describe, expect, mock, test } from "bun:test";

mock.module("@/lib/audit", () => ({ logAudit: async () => {} }));
mock.module("../helpers/supplier-mail-budget", () => ({
  requireSupplierMailBudget: async () => {},
  requireInboxBudget: async () => {},
}));
const sent: string[] = [];
const mail = await import("@/lib/mail");
mock.module("@/lib/mail", () => ({
  ...mail,
  entityInvitesSupplierEmail: async () => ({ subject: "s", html: "h", text: "t" }),
  sendMail: async ({ to }: { to: string }) => {
    sent.push(to);
  },
}));

const { createCallerFactory } = await import("../init");
const { supplierInviteRouter } = await import("./supplier-invite");
const { supplierInvite } = await import("@/schema");
type TRPCContext = import("../init").TRPCContext;

const COMPANY = "44444444-4444-4444-8444-444444444444";
const USER = "11111111-1111-4111-8111-111111111111";
const LISTED = "5e5e5e5e-0000-4000-8000-000000000001";
const FOREIGN = "f0f0f0f0-0000-4000-8000-000000000009";

/** A database whose supplier lookup finds only the sender's own unlinked row. */
function setup(own: readonly string[]) {
  const inserted: Record<string, unknown>[] = [];
  sent.length = 0;
  const db = {
    query: {
      // The lookup's id is one of its conditions; the fake answers by the id the test names.
      supplier: {
        findFirst: async () => (own.includes(asked.id) ? { id: asked.id } : undefined),
      },
      supplierInvite: { findFirst: async () => undefined },
      company: { findFirst: async () => ({ name: "Muster GmbH" }) },
    },
    insert: (table: unknown) => ({
      values: (values: Record<string, unknown>) => ({
        onConflictDoNothing: () => ({
          returning: async () => {
            if (table === supplierInvite) inserted.push(values);
            return [{ id: "invite-1", token: "t".repeat(64), expiresAt: new Date() }];
          },
        }),
      }),
    }),
  };
  const asked = { id: "" };
  const caller = createCallerFactory(supplierInviteRouter)({
    db: db as unknown as TRPCContext["db"],
    session: {
      role: "admin",
      user: { id: USER, email: "a@muster.example" },
    } as TRPCContext["session"],
    userId: USER,
    companyId: COMPANY,
    ip: "test",
    userAgent: null,
  } as TRPCContext);
  return { caller, inserted, asked };
}

describe("supplierInvite.create for a listed supplier", () => {
  test("keeps the row it was sent for, so the reply links it", async () => {
    const { caller, inserted, asked } = setup([LISTED]);
    asked.id = LISTED;
    await caller.create({ toEmail: "security@lieferant.example", supplierId: LISTED });
    expect(inserted).toEqual([expect.objectContaining({ supplierId: LISTED })]);
  });

  test("refuses a row that is not the sender's own or is linked already, and sends nothing", async () => {
    const { caller, inserted, asked } = setup([LISTED]);
    asked.id = FOREIGN;
    await expect(
      caller.create({ toEmail: "security@lieferant.example", supplierId: FOREIGN }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(inserted).toEqual([]);
    expect(sent).toEqual([]);
  });

  test("an invite from the supplier page names no row", async () => {
    const { caller, inserted } = setup([]);
    await caller.create({ toEmail: "security@lieferant.example" });
    expect(inserted).toEqual([expect.objectContaining({ supplierId: null })]);
  });
});
