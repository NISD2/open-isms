/**
 * Where a supplier reaches its customer. Incident broadcasts and their access links are mailed to
 * this address, and the supplier sees it as its customer.
 *
 * A customer company linked through an accepted invite is reached at its own contact address, read
 * each time so a change the customer makes reaches every supplier. A row with no linked company
 * keeps the address the supplier entered for it.
 */
import { eq, inArray } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { company, user } from "@/schema";

/**
 * Each company's contact address, or, when it has none, the address of the person who created it:
 * a supplier needs somewhere to send incident notices. Companies with neither are left out.
 */
export const customerContactEmails = async (
  db: DbOrTx,
  customerCompanyIds: readonly string[],
): Promise<ReadonlyMap<string, string>> => {
  const rows = await db
    .select({
      id: company.id,
      contactEmail: company.contactEmail,
      ownerEmail: user.email,
    })
    .from(company)
    .leftJoin(user, eq(user.id, company.ownerId))
    .where(inArray(company.id, [...customerCompanyIds]));
  return new Map(
    rows.flatMap((row) => {
      // A cleared form field can store "" rather than null; blank means unset.
      const email = row.contactEmail?.trim() || row.ownerEmail;
      return email ? [[row.id, email.toLowerCase()] as const] : [];
    }),
  );
};

/** The two columns that decide where a relationship's customer is reached. */
type CustomerParty = {
  readonly customerCompanyId: string | null;
  readonly customerEmail: string | null;
};

/**
 * The rows with `customerEmail` set to where each customer is reached now. The customer's company id
 * is dropped: it is read only to find that address and is not the supplier's to see.
 *
 * A linked row never falls back to its stored address, because rows accepted before the invite fix
 * stored the supplier's own address there.
 */
export const withCustomerAddress = async <R extends CustomerParty>(
  db: DbOrTx,
  rows: readonly R[],
): Promise<Omit<R, "customerCompanyId">[]> => {
  const linked = [
    ...new Set(
      rows.flatMap((row) => (row.customerCompanyId ? [row.customerCompanyId] : [])),
    ),
  ];
  const contacts =
    linked.length > 0
      ? await customerContactEmails(db, linked)
      : new Map<string, string>();
  return rows.map(({ customerCompanyId, ...row }) => ({
    ...row,
    customerEmail: customerCompanyId
      ? (contacts.get(customerCompanyId) ?? null)
      : row.customerEmail,
  }));
};

/** Where one relationship's customer is reached now, as `withCustomerAddress` decides it. */
export const customerAddressOf = async (
  db: DbOrTx,
  row: CustomerParty,
): Promise<string | null> => {
  const [resolved] = await withCustomerAddress(db, [row]);
  return resolved?.customerEmail ?? null;
};
