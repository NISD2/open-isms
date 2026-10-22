/**
 * A customer linked through an accepted invite is reached at its company's
 * current contact address, so a change the customer makes reaches every
 * supplier, and is shown under its company's name. A row with no linked company
 * keeps the address and name the supplier entered.
 */
import { describe, expect, test } from "bun:test";
import type { DbOrTx } from "@/lib/db";
import { withCustomerAddress } from "./customer-contact";

type Company = {
  readonly id: string;
  readonly name?: string;
  readonly contactEmail: string | null;
  readonly ownerEmail: string | null;
};

/** The one lookup the helper makes: company name, contact and creator address. */
function fakeDb(companies: readonly Company[], lookups: unknown[]) {
  return {
    select: () => ({
      from: () => ({
        leftJoin: () => ({
          where: async (condition: unknown) => {
            lookups.push(condition);
            return companies.map((c) => ({ name: "Kunde GmbH", ...c }));
          },
        }),
      }),
    }),
  } as unknown as DbOrTx;
}

const SUPPLIER_OWN = "security@lieferant.test";

const row = (
  over: Partial<{
    customerCompanyId: string | null;
    customerEmail: string | null;
    customerOrgName: string | null;
  }>,
) => ({
  id: "rel-1",
  customerCompanyId: null,
  customerEmail: null,
  customerOrgName: null,
  ...over,
});

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
      [row({ customerCompanyId: "kunde-a", customerEmail: "alt@kunde-a.test" })],
    );

    // The customer's company id stays behind: it is not the supplier's to see.
    expect(rows).toEqual([
      {
        id: "rel-1",
        customerEmail: "neu@kunde-a.test",
        customerOrgName: "Kunde GmbH",
        customerHasAccount: true,
      },
    ]);
  });

  test("without a contact address, the person who created the company is reached", async () => {
    const rows = await withCustomerAddress(
      fakeDb([{ id: "kunde-a", contactEmail: null, ownerEmail: "GF@Kunde-A.test" }], []),
      [row({ customerCompanyId: "kunde-a" })],
    );

    expect(rows.map((r) => r.customerEmail)).toEqual(["gf@kunde-a.test"]);
  });

  // Rows accepted before the invite fix stored the supplier's own address.
  test("a linked row with no address on file is never mailed at its stored address", async () => {
    const rows = await withCustomerAddress(
      fakeDb([{ id: "kunde-a", contactEmail: null, ownerEmail: null }], []),
      [row({ customerCompanyId: "kunde-a", customerEmail: SUPPLIER_OWN })],
    );

    expect(rows.map((r) => r.customerEmail)).toEqual([null]);
  });

  test("an unlinked row keeps the address the supplier entered, with no lookup", async () => {
    const lookups: unknown[] = [];
    const rows = await withCustomerAddress(fakeDb([], lookups), [
      row({ customerEmail: "isb@kunde-b.test" }),
    ]);

    expect(rows).toEqual([
      {
        id: "rel-1",
        customerEmail: "isb@kunde-b.test",
        customerOrgName: null,
        customerHasAccount: false,
      },
    ]);
    expect(lookups).toHaveLength(0);
  });

  test("an unlinked row with no address yet stays without one", async () => {
    const rows = await withCustomerAddress(fakeDb([], []), [
      row({ customerOrgName: "Kunde B GmbH" }),
    ]);

    expect(rows.map((r) => [r.customerEmail, r.customerOrgName])).toEqual([
      [null, "Kunde B GmbH"],
    ]);
  });

  test("a linked row is shown under the company's own name, unless the supplier typed another", async () => {
    const rows = await withCustomerAddress(
      fakeDb(
        [
          {
            id: "kunde-a",
            name: "Kunde A AG",
            contactEmail: "a@kunde-a.test",
            ownerEmail: null,
          },
          {
            id: "kunde-c",
            name: "Kunde C AG",
            contactEmail: "c@kunde-c.test",
            ownerEmail: null,
          },
        ],
        [],
      ),
      [
        row({ customerCompanyId: "kunde-a" }),
        row({ customerCompanyId: "kunde-c", customerOrgName: "  Einkauf C  " }),
      ],
    );

    // Never the part after the @: for a customer on a mail provider that reads as "gmail.com".
    expect(rows.map((r) => r.customerOrgName)).toEqual(["Kunde A AG", "Einkauf C"]);
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
        row({ customerCompanyId: "kunde-a", customerEmail: SUPPLIER_OWN }),
        row({ customerEmail: "isb@kunde-b.test" }),
        row({ customerCompanyId: "kunde-c", customerEmail: SUPPLIER_OWN }),
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
