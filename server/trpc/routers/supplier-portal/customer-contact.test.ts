/**
 * A customer linked through an accepted invite is reached at its company's
 * current contact address, so a change the customer makes reaches every
 * supplier. A row with no linked company keeps the address the supplier entered.
 */
import { describe, expect, test } from "bun:test";
import type { DbOrTx } from "@/lib/db";
import { withCustomerAddress } from "./customer-contact";

type Company = {
  readonly id: string;
  readonly contactEmail: string | null;
  readonly ownerEmail: string | null;
};

/** The one lookup the helper makes: company contact and creator address. */
function fakeDb(companies: readonly Company[], lookups: unknown[]) {
  return {
    select: () => ({
      from: () => ({
        leftJoin: () => ({
          where: async (condition: unknown) => {
            lookups.push(condition);
            return companies;
          },
        }),
      }),
    }),
  } as unknown as DbOrTx;
}

const SUPPLIER_OWN = "security@lieferant.test";

describe("withCustomerAddress", () => {
  test("a linked row is reached at the company's contact address now, not the stored one", async () => {
    const rows = await withCustomerAddress(
      fakeDb(
        [
          {
            id: "kunde-a",
            contactEmail: "Neu@Kunde-A.test",
            ownerEmail: "gf@kunde-a.test",
          },
        ],
        [],
      ),
      [{ id: "rel-1", customerCompanyId: "kunde-a", customerEmail: "alt@kunde-a.test" }],
    );

    // The customer's company id stays behind: it is not the supplier's to see.
    expect(rows).toEqual([{ id: "rel-1", customerEmail: "neu@kunde-a.test" }]);
  });

  test("without a contact address, the person who created the company is reached", async () => {
    const rows = await withCustomerAddress(
      fakeDb([{ id: "kunde-a", contactEmail: null, ownerEmail: "GF@Kunde-A.test" }], []),
      [{ id: "rel-1", customerCompanyId: "kunde-a", customerEmail: null }],
    );

    expect(rows).toEqual([{ id: "rel-1", customerEmail: "gf@kunde-a.test" }]);
  });

  // Rows accepted before the invite fix stored the supplier's own address.
  test("a linked row with no address on file is never mailed at its stored address", async () => {
    const rows = await withCustomerAddress(
      fakeDb([{ id: "kunde-a", contactEmail: null, ownerEmail: null }], []),
      [{ id: "rel-1", customerCompanyId: "kunde-a", customerEmail: SUPPLIER_OWN }],
    );

    expect(rows).toEqual([{ id: "rel-1", customerEmail: null }]);
  });

  test("an unlinked row keeps the address the supplier entered, with no lookup", async () => {
    const lookups: unknown[] = [];
    const rows = await withCustomerAddress(fakeDb([], lookups), [
      { id: "rel-1", customerCompanyId: null, customerEmail: "isb@kunde-b.test" },
    ]);

    expect(rows).toEqual([{ id: "rel-1", customerEmail: "isb@kunde-b.test" }]);
    expect(lookups).toHaveLength(0);
  });

  test("linked and unlinked rows resolve together in one lookup", async () => {
    const lookups: unknown[] = [];
    const rows = await withCustomerAddress(
      fakeDb(
        [
          { id: "kunde-a", contactEmail: "isb@kunde-a.test", ownerEmail: null },
          { id: "kunde-c", contactEmail: "isb@kunde-c.test", ownerEmail: null },
        ],
        lookups,
      ),
      [
        { id: "rel-1", customerCompanyId: "kunde-a", customerEmail: SUPPLIER_OWN },
        { id: "rel-2", customerCompanyId: null, customerEmail: "isb@kunde-b.test" },
        { id: "rel-3", customerCompanyId: "kunde-c", customerEmail: SUPPLIER_OWN },
      ],
    );

    expect(rows.map((r) => r.customerEmail)).toEqual([
      "isb@kunde-a.test",
      "isb@kunde-b.test",
      "isb@kunde-c.test",
    ]);
    expect(lookups).toHaveLength(1);
  });
});
