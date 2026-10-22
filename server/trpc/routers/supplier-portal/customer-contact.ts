/**
 * Where a supplier reaches its customer, and what it calls them. Incident broadcasts and their
 * access links are mailed to this address, and the supplier sees it as its customer.
 *
 * A customer company linked through an accepted invite is reached at its own contact address, read
 * each time so a change the customer makes reaches every supplier, and is called by its own name
 * unless the supplier typed another. A row with no linked company keeps the address and name the
 * supplier entered for it; a row may have no address yet.
 */
import { eq, inArray } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { company, user } from "@/schema";

type CompanyContact = {
  readonly name: string;
  /** Null when the company has neither a contact address nor a creator with one. */
  readonly email: string | null;
};

/**
 * Each company's name and contact address, or, when it has no address, the address of the person
 * who created it: a supplier needs somewhere to send incident notices.
 */
const customerContacts = async (
  db: DbOrTx,
  customerCompanyIds: readonly string[],
): Promise<ReadonlyMap<string, CompanyContact>> => {
  const rows = await db
    .select({
      id: company.id,
      name: company.name,
      contactEmail: company.contactEmail,
      ownerEmail: user.email,
    })
    .from(company)
    .leftJoin(user, eq(user.id, company.ownerId))
    .where(inArray(company.id, [...customerCompanyIds]));
  return new Map(
    rows.map((row) => {
      // A cleared form field can store "" rather than null; blank means unset.
      const email = row.contactEmail?.trim() || row.ownerEmail;
      return [
        row.id,
        { name: row.name, email: email ? email.toLowerCase() : null },
      ] as const;
    }),
  );
};

/** Each company's contact address. Companies with none are left out. */
export const customerContactEmails = async (
  db: DbOrTx,
  customerCompanyIds: readonly string[],
): Promise<ReadonlyMap<string, string>> => {
  const contacts = await customerContacts(db, customerCompanyIds);
  return new Map(
    [...contacts].flatMap(([id, contact]) =>
      contact.email ? [[id, contact.email]] : [],
    ),
  );
};

/** The two columns that decide where a relationship's customer is reached. */
type CustomerParty = {
  readonly customerCompanyId: string | null;
  readonly customerEmail: string | null;
};

/** What the supplier sees of a customer: where it is reached, and the name to show for it. */
type NamedCustomerParty = CustomerParty & { readonly customerOrgName: string | null };

/**
 * The rows with `customerEmail` set to where each customer is reached now and `customerOrgName` to
 * the name to show: the one the supplier typed, else the linked company's own. The customer's
 * company id is dropped: it is read only to find these and is not the supplier's to see.
 *
 * A linked row never falls back to its stored address, because rows accepted before the invite fix
 * stored the supplier's own address there.
 */
export const withCustomerAddress = async <R extends NamedCustomerParty>(
  db: DbOrTx,
  rows: readonly R[],
): Promise<
  (Omit<R, "customerCompanyId"> & { readonly customerHasAccount: boolean })[]
> => {
  const linked = [
    ...new Set(
      rows.flatMap((row) => (row.customerCompanyId ? [row.customerCompanyId] : [])),
    ),
  ];
  const contacts =
    linked.length > 0
      ? await customerContacts(db, linked)
      : new Map<string, CompanyContact>();
  return rows.map(({ customerCompanyId, ...row }) => {
    const contact = customerCompanyId ? contacts.get(customerCompanyId) : undefined;
    return {
      ...row,
      // Only whether, so the supplier knows the address is the customer's to change, not which.
      customerHasAccount: customerCompanyId !== null,
      customerEmail: customerCompanyId ? (contact?.email ?? null) : row.customerEmail,
      customerOrgName:
        row.customerOrgName?.trim() || contact?.name || row.customerOrgName,
    };
  });
};

/** Where one relationship's customer is reached now, as `withCustomerAddress` decides it. */
export const customerAddressOf = async (
  db: DbOrTx,
  row: CustomerParty,
): Promise<string | null> => {
  if (!row.customerCompanyId) return row.customerEmail;
  const contacts = await customerContactEmails(db, [row.customerCompanyId]);
  return contacts.get(row.customerCompanyId) ?? null;
};
